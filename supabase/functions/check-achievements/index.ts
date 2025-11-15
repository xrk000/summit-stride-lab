import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  condition_type: string
  condition_value: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

    if (userError || !user) {
      console.error('Auth error:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Checking achievements for user:', user.id)

    // Get all achievements
    const { data: achievements, error: achievementsError } = await supabaseClient
      .from('achievements')
      .select('*')

    if (achievementsError) {
      console.error('Error fetching achievements:', achievementsError)
      throw achievementsError
    }

    // Get user's current achievements
    const { data: userAchievements, error: userAchievementsError } = await supabaseClient
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', user.id)

    if (userAchievementsError) {
      console.error('Error fetching user achievements:', userAchievementsError)
      throw userAchievementsError
    }

    const earnedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || [])

    // Get user statistics
    const [tasks, completedTasks, notes, habits, habitEntries, events, projects] = await Promise.all([
      supabaseClient.from('tasks').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabaseClient.from('tasks').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('completed', true),
      supabaseClient.from('notes').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabaseClient.from('habits').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabaseClient.from('habit_entries').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('completed', true),
      supabaseClient.from('calendar_events').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabaseClient.from('projects').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ])

    const stats = {
      tasks_completed: completedTasks.count || 0,
      total_tasks: tasks.count || 0,
      notes_created: notes.count || 0,
      habits_tracked: habits.count || 0,
      habit_entries_completed: habitEntries.count || 0,
      calendar_events: events.count || 0,
      projects_created: projects.count || 0,
    }

    console.log('User stats:', stats)

    const newAchievements: string[] = []

    // Check each achievement
    for (const achievement of achievements as Achievement[]) {
      if (earnedIds.has(achievement.id)) {
        continue // Already earned
      }

      let earned = false
      const conditionType = achievement.condition_type
      const conditionValue = achievement.condition_value

      // Check if condition is met
      switch (conditionType) {
        case 'tasks_completed':
          earned = stats.tasks_completed >= conditionValue
          break
        case 'notes_created':
          earned = stats.notes_created >= conditionValue
          break
        case 'habits_tracked':
          earned = stats.habits_tracked >= conditionValue
          break
        case 'habit_entries_completed':
          earned = stats.habit_entries_completed >= conditionValue
          break
        case 'calendar_events':
          earned = stats.calendar_events >= conditionValue
          break
        case 'projects_created':
          earned = stats.projects_created >= conditionValue
          break
        case 'total_tasks':
          earned = stats.total_tasks >= conditionValue
          break
        default:
          console.warn(`Unknown condition type: ${conditionType}`)
      }

      if (earned) {
        console.log(`Achievement earned: ${achievement.name}`)
        const { error: insertError } = await supabaseClient
          .from('user_achievements')
          .insert({
            user_id: user.id,
            achievement_id: achievement.id,
          })

        if (insertError) {
          console.error('Error inserting achievement:', insertError)
        } else {
          newAchievements.push(achievement.id)
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        newAchievements,
        message: newAchievements.length > 0 
          ? `Получено новых достижений: ${newAchievements.length}` 
          : 'Новых достижений нет'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in check-achievements function:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
