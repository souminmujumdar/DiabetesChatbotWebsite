'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Clock, Activity, Award, BarChart } from "lucide-react"

interface Exercise {
  id: number
  name: string
  description: string
  duration: number
  intensity: string
  benefits?: string
  user_duration?: number
}

// Exercise type icons based on name - using SVG elements instead of placeholder images
const ExerciseIcon = ({ exerciseName, className = "h-48 w-full" }: { exerciseName: string, className?: string }) => {
  const name = exerciseName.toLowerCase()
  let iconColor = "#3B82F6" // blue-500
  
  return (
    <div className={`flex items-center justify-center bg-blue-50 ${className}`}>
      {name.includes('run') || name.includes('jog') || name.includes('sprint') ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16">
          <path d="M13 4v6m-1.5-6A2 2 0 0 0 10 6v5a2 2 0 0 0 2 2h3a2 2 0 0 0 2-2 2 2 0 0 0-2-2h-3"></path>
          <path d="m18 20 2-5 1.9.3a2 2 0 0 0 2.199-2.375C23.95 11.864 23.192 10 20 10l-2 8-2 2h-8"></path>
          <path d="M5 15h3m-5 0a5 5 0 0 1 10 0 5 5 0 0 1-10 0Z"></path>
        </svg>
      ) : name.includes('swim') ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16">
          <path d="M4 22c1.5 0 3-1.5 3-1.5S8.5 22 10 22s3-1.5 3-1.5S14.5 22 16 22s3-1.5 3-1.5S20.5 22 22 22"></path>
          <path d="M4 19c1.5 0 3-1.5 3-1.5S8.5 19 10 19s3-1.5 3-1.5S14.5 19 16 19s3-1.5 3-1.5S20.5 19 22 19"></path>
          <path d="M14 4c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2Z"></path>
          <path d="M7 16c1.1-1.7 2.5-3 6-3 3.4 0 4.9 1.2 6 3"></path>
          <path d="m15 8-3 2-3-2"></path>
          <path d="M5 14.5 7 12l5 1 5-1 2 2.5"></path>
        </svg>
      ) : name.includes('yoga') || name.includes('stretch') ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16">
          <path d="M12 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"></path>
          <path d="M9 19h6"></path>
          <path d="M9 15v4"></path>
          <path d="M15 15v4"></path>
          <path d="m5 7-3 3 3 3"></path>
          <path d="m19 7 3 3-3 3"></path>
        </svg>
      ) : name.includes('weight') || name.includes('lift') || name.includes('strength') ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16">
          <path d="M12 5v14"></path>
          <path d="M6 9v6"></path>
          <path d="M18 9v6"></path>
          <path d="M6 6h12"></path>
          <path d="M6 18h12"></path>
          <path d="M3 6v12"></path>
          <path d="M21 6v12"></path>
        </svg>
      ) : name.includes('bike') || name.includes('cycle') ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16">
          <path d="M8 17a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"></path>
          <path d="M16 17a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"></path>
          <path d="m14 7 2 3-7 1 1 5"></path>
          <path d="M11 10H5"></path>
          <path d="m15 7-1-3h-4l1.5 3"></path>
        </svg>
      ) : name.includes('walk') ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16">
          <path d="M13 8c0 2-1.4 4-4 4"></path>
          <path d="m7 13 3.4 6.6c.2.4.8.4 1 0L15 8"></path>
          <path d="M9 5a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z"></path>
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16">
          <path d="M12 10v.01M12 14v.01M9 14v.01M15 14v.01M9 10v.01M15 10v.01"></path>
          <path d="M12 19a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z"></path>
          <path d="M12 19v2"></path>
          <path d="M12 3v2"></path>
          <path d="m14 5 1-1"></path>
          <path d="m9 5-1-1"></path>
          <path d="M14 19.02 18 21"></path>
          <path d="m10 19-4 2"></path>
        </svg>
      )}
    </div>
  )
}

// Get intensity color
const getIntensityColor = (intensity: string) => {
  switch (intensity.toLowerCase()) {
    case 'low': return 'bg-blue-500'
    case 'medium': return 'bg-yellow-500'
    case 'high': return 'bg-orange-500'
    case 'very high': return 'bg-red-500'
    default: return 'bg-gray-500'
  }
}

export default function ExerciseTracker() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [recommendedExercises, setRecommendedExercises] = useState<Exercise[]>([])
  const [userExercises, setUserExercises] = useState<Exercise[]>([])
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [exerciseDurations, setExerciseDurations] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [totalDuration, setTotalDuration] = useState(0)
  const dailyGoal = 60 // 60 minutes daily exercise goal

  const fetchExercises = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:5000/exercises')
      if (!response.ok) throw new Error('Failed to fetch exercises')
      const data = await response.json()
      setExercises(data)
    } catch (error) {
      console.error("Error fetching exercises:", error)
      setError("Unable to load exercises. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const fetchRecommendedExercises = async () => {
    setLoading(true)
    try {
      const response = await fetch(`http://localhost:5000/exercises/recommend?userId=${encodeURIComponent('default_user')}`)
      if (!response.ok) throw new Error('Failed to fetch recommended exercises')
      const data = await response.json()
      setRecommendedExercises(data)
    } catch (error) {
      console.error("Error fetching recommended exercises:", error)
      setError("Unable to load personalized recommendations. Showing default exercises.")
    } finally {
      setLoading(false)
    }
  }

  const fetchUserExercises = async () => {
    setLoading(true)
    try {
      const response = await fetch(`http://localhost:5000/user/exercises?date=${date}`)
      if (!response.ok) throw new Error('Failed to fetch user exercises')
      const data = await response.json()
      setUserExercises(data)
      
      // Calculate total duration for progress bar
      const total = data.reduce((sum: number, exercise: Exercise) => 
        sum + (exercise.user_duration || 0), 0)
      setTotalDuration(total)
    } catch (error) {
      console.error("Error fetching user exercises:", error)
      setError("Unable to load exercise log. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const logExercise = async (exerciseId: number) => {
    const duration = exerciseDurations[exerciseId]
    if (!duration) {
      setError("Please enter a duration")
      return
    }
    try {
      const response = await fetch('http://localhost:5000/user/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          exercise_id: exerciseId, 
          duration: Number(duration), 
          date 
        })
      })
      
      // Check if response is ok without throwing an error
      if (!response.ok) {
        console.error("Server error:", response.status, response.statusText)
        setError(`Failed to log exercise: ${response.statusText}`)
        return
      }
      
      // Reset just this exercise's duration
      setExerciseDurations(prev => ({
        ...prev,
        [exerciseId]: ''
      }))
      
      setError(null)
      setSuccessMessage("Exercise logged successfully!")
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)
      
      fetchUserExercises()
    } catch (error: any) {
      console.error("Error logging exercise:", error)
      setError(`Failed to log exercise: ${error.message || 'Unknown error'}`)
    }
  }

  const handleDurationChange = (exerciseId: number, value: string) => {
    setExerciseDurations(prev => ({
      ...prev,
      [exerciseId]: value
    }))
  }

  useEffect(() => {
    fetchExercises()
    fetchRecommendedExercises()
    fetchUserExercises()
  }, [date])

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-3xl font-bold mb-4 text-center">Exercise Tracker</h1>
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="w-full md:w-auto">
            <Label htmlFor="date" className="text-lg">Select Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-48 mt-1"
            />
          </div>
          
          <div className="w-full md:w-2/3">
            <div className="flex items-center gap-3 mb-1">
              <Activity className="h-5 w-5 text-blue-600" />
              <span className="font-semibold">Daily Progress: {totalDuration}/{dailyGoal} mins</span>
            </div>
            <Progress value={(totalDuration / dailyGoal) * 100} className="h-4" />
          </div>
        </div>
        
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {successMessage}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-md">
          <CardHeader className="border-b bg-gray-50">
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-600" />
              Recommended Exercises
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
              </div>
            ) : (
              <>
                {recommendedExercises.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Personalized for You
                    </h3>
                    <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
                      {recommendedExercises.map((exercise) => (
                        <div key={exercise.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                          <div className="relative">
                            <ExerciseIcon exerciseName={exercise.name} />
                            <div className={`absolute top-2 right-2 rounded-full px-3 py-1 text-white text-xs font-bold ${getIntensityColor(exercise.intensity)}`}>
                              {exercise.intensity}
                            </div>
                          </div>
                          <div className="p-4">
                            <h4 className="text-lg font-semibold">{exercise.name}</h4>
                            <p className="text-gray-600 mb-2">{exercise.description}</p>
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <span>Recommended: {exercise.duration} mins</span>
                            </div>
                            <p className="text-sm text-gray-700 mb-3"><span className="font-semibold">Benefits:</span> {exercise.benefits}</p>
                            <div className="flex gap-2 mt-2">
                              <Input
                                type="number"
                                placeholder="Duration (mins)"
                                value={exerciseDurations[exercise.id] || ''}
                                onChange={(e) => handleDurationChange(exercise.id, e.target.value)}
                                className="w-32"
                              />
                              <Button 
                                onClick={() => logExercise(exercise.id)}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                Log Exercise
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Other Exercises
                </h3>
                <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
                  {exercises.map((exercise) => (
                    <div key={exercise.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="relative">
                        <ExerciseIcon exerciseName={exercise.name} />
                        <div className={`absolute top-2 right-2 rounded-full px-3 py-1 text-white text-xs font-bold ${getIntensityColor(exercise.intensity)}`}>
                          {exercise.intensity}
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="text-lg font-semibold">{exercise.name}</h4>
                        <p className="text-gray-600 mb-2">{exercise.description}</p>
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span>Recommended: {exercise.duration} mins</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-3"><span className="font-semibold">Benefits:</span> {exercise.benefits}</p>
                        <div className="flex gap-2 mt-2">
                          <Input
                            type="number"
                            placeholder="Duration (mins)"
                            value={exerciseDurations[exercise.id] || ''}
                            onChange={(e) => handleDurationChange(exercise.id, e.target.value)}
                            className="w-32"
                          />
                          <Button 
                            onClick={() => logExercise(exercise.id)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Log Exercise
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="border-b bg-gray-50">
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5 text-blue-600" />
              Your Exercise Log for {date}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
              </div>
            ) : userExercises.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-lg font-medium">No exercises logged for this date.</p>
                <p>Start by logging an exercise from the recommended list.</p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Daily Summary</h3>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {totalDuration} mins total
                    </span>
                  </div>
                  <Progress value={(totalDuration / dailyGoal) * 100} className="h-4 mb-1" />
                  <div className="flex justify-between text-sm">
                    <span>0 mins</span>
                    <span className={totalDuration >= dailyGoal ? "text-green-600 font-medium" : "text-gray-500"}>
                      Goal: {dailyGoal} mins
                    </span>
                  </div>
                </div>
                <div className="grid gap-4">
                  {userExercises.map((exercise) => (
                    <div key={exercise.id} className="flex border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="w-1/3">
                        <ExerciseIcon exerciseName={exercise.name} className="h-full w-full" />
                      </div>
                      <div className="p-4 w-2/3">
                        <div className="flex justify-between items-start">
                          <h3 className="text-lg font-semibold">{exercise.name}</h3>
                          <span className={`rounded-full px-3 py-1 text-white text-xs font-bold ${getIntensityColor(exercise.intensity)}`}>
                            {exercise.intensity}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{exercise.description}</p>
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span className="font-semibold">{exercise.user_duration} mins</span>
                        </div>
                        <p className="text-xs text-gray-700"><span className="font-semibold">Benefits:</span> {exercise.benefits}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}