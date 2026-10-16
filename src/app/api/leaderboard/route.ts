export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { serverCache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const db = getDatabase();

    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level') || 'grade'; // 'class' | 'grade' | 'school' | 'class_battle'
    const gradeParam = searchParams.get('grade_id') || (user?.grade_id ? user.grade_id : '10');
    const classParam = searchParams.get('class_id') || (user?.class_id ? user.class_id : '10TN');
    const gradeNum = parseInt(gradeParam, 10);

    // TRƯỜNG HỢP 1: Đua Top Tập thể Lớp (Class vs. Class)
    if (level === 'class_battle') {
      const cacheKey = 'leaderboard_class_battle';
      const classRankings = await serverCache.getOrSet(cacheKey, 15, () => {
        // Tính điểm trung bình và tỷ lệ % học sinh tham gia của từng lớp
        const classRows = db.prepare(`
          SELECT 
            u.class_id,
            u.grade_id,
            COUNT(DISTINCT u.id) as total_students,
            COUNT(DISTINCT s.user_email) as participating_students,
            AVG(s.score) as avg_score,
            MAX(s.score) as max_score,
            SUM(u.xp_points) as total_class_xp
          FROM Users u
          LEFT JOIN Submissions s ON u.email = s.user_email
          WHERE u.role = 'STUDENT'
          GROUP BY u.class_id, u.grade_id
          ORDER BY avg_score DESC, participating_students DESC, total_class_xp DESC
        `).all() as any[];

        return classRows.map((r, index) => {
          const total = r.total_students || 1;
          const part = r.participating_students || 0;
          const participationRate = Math.round((part / total) * 100);
          const avgScore = r.avg_score !== null ? Math.round(r.avg_score * 100) / 100 : 0;

          return {
            rank: index + 1,
            class_id: r.class_id,
            grade_id: r.grade_id,
            total_students: total,
            participating_students: part,
            participation_rate: participationRate,
            avg_score: avgScore,
            max_score: r.max_score || 0,
            total_xp: r.total_class_xp || 0,
          };
        });
      });

      return NextResponse.json({
        level: 'class_battle',
        class_rankings: classRankings,
      });
    }

    // TRƯỜNG HỢP 2: Bảng xếp hạng Cá nhân (Class / Grade / School)
    const indivCacheKey = `leaderboard_indiv_${level}_${gradeParam}_${classParam}`;
    const { formattedRankings, podium } = await serverCache.getOrSet(indivCacheKey, 15, () => {
      let whereCondition = "WHERE u.role = 'STUDENT'";
      const params: any[] = [];

      if (level === 'class') {
        whereCondition += ' AND u.class_id = ?';
        params.push(classParam);
      } else if (level === 'grade') {
        whereCondition += ' AND u.grade_id = ?';
        params.push(String(gradeNum));
      }

      // Câu truy vấn tính Rank_Score và XP_Points với Tie-breaker:
      // Tie-breaker: Score DESC -> Duration ASC -> Attempt Count ASC -> Earliest Submit ASC
      const sql = `
        SELECT 
          u.email,
          u.full_name,
          u.class_id,
          u.grade_id,
          u.xp_points,
          u.streak_days,
          COALESCE(MAX(CASE WHEN s.is_first_attempt = 1 THEN s.score ELSE NULL END), MAX(s.score), 0) as best_score,
          COALESCE(MIN(CASE WHEN s.is_first_attempt = 1 THEN s.duration_sec ELSE NULL END), MIN(s.duration_sec), 999999) as best_duration,
          COUNT(s.id) as attempts_count,
          MIN(s.submitted_at) as earliest_submit
        FROM Users u
        LEFT JOIN Submissions s ON u.email = s.user_email
        ${whereCondition}
        GROUP BY u.email, u.full_name, u.class_id, u.grade_id, u.xp_points, u.streak_days
        ORDER BY 
          best_score DESC,
          best_duration ASC,
          attempts_count ASC,
          u.xp_points DESC,
          earliest_submit ASC
      `;

      const rawRankings = db.prepare(sql).all(...params) as any[];

      // Gán thứ hạng và danh hiệu tự động
      let fastestCandidate = { email: '', duration: 999999 };
      let highestXpCandidate = { email: '', xp: -1 };

      rawRankings.forEach((r) => {
        if (r.best_score >= 8.0 && r.best_duration < fastestCandidate.duration && r.best_duration > 0) {
          fastestCandidate = { email: r.email, duration: r.best_duration };
        }
        if (r.xp_points > highestXpCandidate.xp) {
          highestXpCandidate = { email: r.email, xp: r.xp_points };
        }
      });

      const rankingsList = rawRankings.map((r, index) => {
        const titles: string[] = [];

        if (index === 0 && r.best_score >= 9.0) {
          titles.push('Bách Phát Bách Trúng');
        }
        if (r.email === fastestCandidate.email) {
          titles.push('Thủ Khoa Tốc Độ');
        }
        if (r.email === highestXpCandidate.email && r.xp_points > 100) {
          titles.push('Chiến Thần Chăm Chỉ');
        }

        return {
          rank: index + 1,
          email: r.email,
          full_name: r.full_name,
          class_id: r.class_id,
          grade_id: r.grade_id,
          best_score: r.best_score,
          duration_sec: r.best_duration === 999999 ? 0 : r.best_duration,
          xp_points: r.xp_points,
          streak_days: r.streak_days,
          attempts_count: r.attempts_count,
          titles,
        };
      });

      return {
        formattedRankings: rankingsList,
        podium: rankingsList.slice(0, 3),
      };
    });

    // Tìm vị trí của user hiện tại (My Sticky Rank)
    let myRankInfo = null;
    if (user) {
      const myIndex = formattedRankings.findIndex((r) => r.email === user.email);
      if (myIndex >= 0) {
        myRankInfo = formattedRankings[myIndex];
      } else {
        myRankInfo = {
          rank: formattedRankings.length + 1,
          email: user.email,
          full_name: user.full_name,
          class_id: user.class_id,
          grade_id: user.grade_id,
          best_score: 0,
          duration_sec: 0,
          xp_points: user.xp_points || 0,
          streak_days: user.streak_days || 1,
          attempts_count: 0,
          titles: [],
        };
      }
    }

    return NextResponse.json({
      level,
      grade_id: gradeNum,
      class_id: classParam,
      total_participants: formattedRankings.length,
      podium,
      rankings: formattedRankings,
      my_rank: myRankInfo,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

