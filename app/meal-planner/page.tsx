'use client'

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Loader2, MessageCircle, Calendar, User, Search, Plus, X, ChevronRight, ArrowRight } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { format, parseISO } from "date-fns"

interface Recipe {
  id: number
  name: string
  description: string
  calories: number
  carbs: number
  glycemic_index: string
  ingredients: string[]
  instructions: string
  nutritional_benefits: string
  diet: string
}

interface Meal {
  meal_type: string
  recipes: Recipe[]
}

interface DailyMealPlan {
  date: string
  meals: Meal[]
}

interface MealPlan {
  meal_plan: DailyMealPlan[]
}

interface UserProfile {
  age?: number
  gender?: string
  weight?: number
  height?: number
  activityLevel?: string
  dietType: string
  allergies: string[]
  preferences: string[]
  avoidances: string[]
  diabetesType?: string
  bloodSugarLevels?: string
  medicationDetails?: string
  lastUpdated?: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export default function DiabetesMealPlanner() {
  // User profile state
  const [profile, setProfile] = useState<UserProfile>({
    dietType: 'vegetarian',
    allergies: [],
    preferences: [],
    avoidances: []
  })
  
  // Meal planning states
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [generatingPlan, setGeneratingPlan] = useState(false)
  const [viewDate, setViewDate] = useState<string>(new Date().toISOString().split('T')[0])
  
  // Recipe search states
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Recipe[]>([])
  const [searching, setSearching] = useState(false)
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [currentMessage, setCurrentMessage] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  
  // Error handling
  const [error, setError] = useState<string | null>(null)
  
  // API URL
  const API_URL = "http://localhost:5000"
  
  // User ID - in a real app, this would come from authentication
  const userId = 'default_user'
  
  // Load user profile on mount
  useEffect(() => {
    fetchUserProfile()
  }, [])
  
  // Scroll chat to bottom when messages change
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages])
  
  // Fetch user profile from API
  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/user/profile?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        if (Object.keys(data).length > 0) {
          setProfile(data)
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
    }
  }
  
  // Save user profile
  const saveProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/user/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...profile
        })
      })
      
      if (response.ok) {
        toast({
          title: "Profile Saved",
          description: "Your profile has been updated successfully.",
        })
      } else {
        throw new Error("Failed to save profile")
      }
    } catch (error) {
      console.error("Error saving profile:", error)
      setError("Failed to save profile. Please try again.")
    }
  }
  
  // Generate meal plan
  const generateMealPlan = async () => {
    setGeneratingPlan(true)
    setError(null)
    
    try {
      const response = await fetch(`${API_URL}/meal-plan/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          days: 7,
          startDate: selectedDate
        })
      })
      
      if (!response.ok) {
        throw new Error("Failed to generate meal plan")
      }
      
      const data = await response.json()
      setMealPlan(data)
      setViewDate(selectedDate)
      
      toast({
        title: "Meal Plan Generated",
        description: "Your personalized meal plan is ready!",
      })
    } catch (error) {
      console.error("Error generating meal plan:", error)
      setError("Failed to generate meal plan. Please try again.")
    } finally {
      setGeneratingPlan(false)
    }
  }
  
  // Fetch meal plan
  const fetchMealPlan = async () => {
    try {
      const response = await fetch(`${API_URL}/meal-plan?userId=${userId}`)
      
      if (response.ok) {
        const data = await response.json()
        if (Object.keys(data).length > 0 && !data.error) {
          setMealPlan(data)
        }
      }
    } catch (error) {
      console.error("Error fetching meal plan:", error)
    }
  }
  
  // Search recipes
  const searchRecipes = async () => {
    if (!searchQuery.trim()) return
    
    setSearching(true)
    setError(null)
    
    try {
      const response = await fetch(`${API_URL}/recipes/search?query=${encodeURIComponent(searchQuery)}&dietType=${profile.dietType}`)
      
      if (!response.ok) {
        throw new Error("Failed to search recipes")
      }
      
      const data = await response.json()
      setSearchResults(data)
    } catch (error) {
      console.error("Error searching recipes:", error)
      setError("Failed to search recipes. Please try again.")
    } finally {
      setSearching(false)
    }
  }
  
  // Send message to chatbot
  const sendMessage = async () => {
    if (!currentMessage.trim()) return
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: currentMessage,
      timestamp: Date.now()
    }
    
    setChatMessages(prev => [...prev, userMessage])
    setCurrentMessage("")
    setChatLoading(true)
    
    try {
      const response = await fetch(`${API_URL}/chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          message: userMessage.content
        })
      })
      
      if (!response.ok) {
        throw new Error("Failed to get response from chatbot")
      }
      
      const data = await response.json()
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: Date.now()
      }
      
      setChatMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error sending message to chatbot:", error)
      
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: "I'm sorry, I'm having trouble responding right now. Please try again later.",
        timestamp: Date.now()
      }
      
      setChatMessages(prev => [...prev, errorMessage])
    } finally {
      setChatLoading(false)
    }
  }
  
  // Update profile field
  const updateProfile = (field: keyof UserProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }))
  }
  
  // Add item to list field
  const addToList = (field: 'allergies' | 'preferences' | 'avoidances', value: string) => {
    if (!value.trim()) return
    setProfile(prev => ({
      ...prev,
      [field]: [...prev[field], value]
    }))
  }
  
  // Remove item from list field
  const removeFromList = (field: 'allergies' | 'preferences' | 'avoidances', index: number) => {
    setProfile(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMMM d, yyyy')
    } catch {
      return dateString
    }
  }
  
  // Get daily meal plan for current view date
  const getCurrentDayMealPlan = () => {
    if (!mealPlan || !mealPlan.meal_plan) return null
    return mealPlan.meal_plan.find(day => day.date === viewDate)
  }
  
  // Get available dates from meal plan
  const getMealPlanDates = () => {
    if (!mealPlan || !mealPlan.meal_plan) return []
    return mealPlan.meal_plan.map(day => day.date)
  }
  
  // Move to next/previous day in meal plan
  const navigateDay = (direction: 'prev' | 'next') => {
    const dates = getMealPlanDates()
    const currentIndex = dates.indexOf(viewDate)
    
    if (direction === 'next' && currentIndex < dates.length - 1) {
      setViewDate(dates[currentIndex + 1])
    } else if (direction === 'prev' && currentIndex > 0) {
      setViewDate(dates[currentIndex - 1])
    }
  }
  
  // Get glycemic index color class
  const getGIColorClass = (gi: string) => {
    switch (gi.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  
  // Generate initial welcome message
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      role: 'assistant',
      content: "Hello! I'm your diabetes nutrition assistant. I can help you with meal planning, recipe suggestions, and answer questions about managing diabetes through diet. How can I assist you today?",
      timestamp: Date.now()
    }
    setChatMessages([welcomeMessage])
  }, [])
  
  // Load initial meal plan
  useEffect(() => {
    fetchMealPlan()
  }, [])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Diabetes Meal Planner</h1>
      
      {error && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="meal-plan" className="mb-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="meal-plan">Meal Plan</TabsTrigger>
          <TabsTrigger value="recipes">Recipe Search</TabsTrigger>
          <TabsTrigger value="chat">Nutrition Chat</TabsTrigger>
          <TabsTrigger value="profile">Your Profile</TabsTrigger>
        </TabsList>
        
        {/* Meal Plan Tab */}
        <TabsContent value="meal-plan" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Meal Plan</CardTitle>
              <CardDescription>Generate a personalized weekly meal plan for your diabetes management</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 flex flex-wrap gap-4 items-end">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-48"
                  />
                </div>
                <Button 
                  onClick={generateMealPlan} 
                  className="bg-blue-600 hover:bg-blue-700" 
                  disabled={generatingPlan}
                >
                  {generatingPlan ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Plan...
                    </>
                  ) : (
                    "Generate Meal Plan"
                  )}
                </Button>
              </div>
              
              {mealPlan && mealPlan.meal_plan && mealPlan.meal_plan.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4 bg-gray-50 p-3 rounded-lg">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigateDay('prev')}
                      disabled={getMealPlanDates().indexOf(viewDate) === 0}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">{formatDate(viewDate)}</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigateDay('next')}
                      disabled={getMealPlanDates().indexOf(viewDate) === getMealPlanDates().length - 1}
                    >
                      Next
                    </Button>
                  </div>
                  
                  {getCurrentDayMealPlan() ? (
                    <Accordion type="single" collapsible className="w-full">
                      {getCurrentDayMealPlan()?.meals.map((meal, index) => (
                        <AccordionItem key={index} value={`meal-${index}`}>
                          <AccordionTrigger className="hover:bg-gray-50 px-3">
                            {meal.meal_type}
                          </AccordionTrigger>
                          <AccordionContent className="px-4">
                            {meal.recipes.map((recipe, recipeIndex) => (
                              <div key={recipeIndex} className="border rounded-lg p-4 mb-4">
                                <h4 className="text-lg font-semibold mb-1">{recipe.name}</h4>
                                <p className="text-gray-600 mb-3">{recipe.description}</p>
                                <div className="flex flex-wrap gap-2 mb-3">
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                    Calories: {recipe.calories}
                                  </span>
                                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                                    Carbs: {recipe.carbs}g
                                  </span>
                                  <span className={`px-2 py-1 rounded-full text-sm ${getGIColorClass(recipe.glycemic_index)}`}>
                                    GI: {recipe.glycemic_index}
                                  </span>
                                </div>
                                
                                <h5 className="font-medium mt-3 mb-1">Ingredients:</h5>
                                <ul className="list-disc pl-5 mb-3">
                                  {recipe.ingredients.map((ingredient, i) => (
                                    <li key={i} className="text-sm text-gray-700">{ingredient}</li>
                                  ))}
                                </ul>
                                
                                <h5 className="font-medium mt-3 mb-1">Instructions:</h5>
                                <p className="text-sm text-gray-700 mb-3">{recipe.instructions}</p>
                                
                                <h5 className="font-medium mt-3 mb-1">Nutritional Benefits:</h5>
                                <p className="text-sm text-gray-700">{recipe.nutritional_benefits}</p>
                              </div>
                            ))}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  ) : (
                    <div className="text-center py-10 border rounded-lg">
                      <p className="text-gray-500">No meal plan available for this date.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-10 border rounded-lg">
                  <p className="text-gray-500">
                    {generatingPlan 
                      ? "Creating your personalized meal plan..." 
                      : "No meal plan generated yet. Select a start date and click 'Generate Meal Plan'."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Recipe Search Tab */}
        <TabsContent value="recipes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Diabetes-Friendly Indian Recipes</CardTitle>
              <CardDescription>Find recipes that match your dietary preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-6">
                <Input
                  placeholder="Search for recipes (e.g., dal, chana, paneer)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchRecipes()}
                />
                <Button 
                  onClick={searchRecipes}
                  disabled={searching || !searchQuery.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {searching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {searching ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-4">
                  {searchResults.map((recipe) => (
                    <Card key={recipe.id} className="overflow-hidden">
                      <CardHeader className="bg-gray-50 pb-3">
                        <CardTitle className="text-lg">{recipe.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <p className="text-gray-600 mb-3">{recipe.description}</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            Calories: {recipe.calories}
                          </span>
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                            Carbs: {recipe.carbs}g
                          </span>
                          <span className={`px-2 py-1 rounded-full text-sm ${getGIColorClass(recipe.glycemic_index)}`}>
                            GI: {recipe.glycemic_index}
                          </span>
                        </div>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">View Recipe Details</Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>{recipe.name}</DialogTitle>
                              <DialogDescription>{recipe.description}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 mt-2">
                              <div className="flex flex-wrap gap-2">
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                  Calories: {recipe.calories}
                                </span>
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                                  Carbs: {recipe.carbs}g
                                </span>
                                <span className={`px-2 py-1 rounded-full text-sm ${getGIColorClass(recipe.glycemic_index)}`}>
                                  GI: {recipe.glycemic_index}
                                </span>
                              </div>
                              
                              <h5 className="font-medium">Ingredients:</h5>
                              <ul className="list-disc pl-5">
                                {recipe.ingredients.map((ingredient, i) => (
                                  <li key={i} className="text-sm">{ingredient}</li>
                                ))}
                              </ul>
                              
                              <h5 className="font-medium">Instructions:</h5>
                              <p className="text-sm">{recipe.instructions}</p>
                              
                              <h5 className="font-medium">Nutritional Benefits:</h5>
                              <p className="text-sm">{recipe.nutritional_benefits}</p>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 border rounded-lg">
                  <p className="text-gray-500">
                    {searchQuery.trim() 
                      ? "No recipes found. Try a different search term." 
                      : "Enter a search term to find diabetes-friendly Indian recipes."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Chat Tab */}
        <TabsContent value="chat" className="space-y-4">
          <Card className="h-[70vh] flex flex-col">
            <CardHeader>
              <CardTitle>Chat with Nutrition Assistant</CardTitle>
              <CardDescription>Get personalized advice for managing diabetes through diet</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col overflow-hidden">
              <div className="flex-grow overflow-y-auto mb-4 pr-2 space-y-4">
                {chatMessages.map((msg, i) => (
                  <div 
                    key={i} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        msg.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.content}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {format(new Date(msg.timestamp), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              
              <div className="flex gap-2 mt-auto">
                <Input
                  placeholder="Type your message..."
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  disabled={chatLoading}
                />
                <Button 
                  onClick={sendMessage}
                  disabled={chatLoading || !currentMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {chatLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Health Profile</CardTitle>
              <CardDescription>Customize your plan with your health information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input 
                    id="age" 
                    type="number" 
                    value={profile.age || ''}
                    onChange={(e) => updateProfile('age', parseInt(e.target.value) || '')}
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select 
                    value={profile.gender || ''} 
                    onValueChange={(value) => updateProfile('gender', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input 
                    id="weight" 
                    type="number" 
                    value={profile.weight || ''}
                    onChange={(e) => updateProfile('weight', parseFloat(e.target.value) || '')}
                  />
                </div>
                <div>
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input 
                    id="height" 
                    type="number" 
                    value={profile.height || ''}
                    onChange={(e) => updateProfile('height', parseFloat(e.target.value) || '')}
                  />
                </div>
                <div>
                  <Label htmlFor="activityLevel">Activity Level</Label>
                  <Select 
                    value={profile.activityLevel || ''} 
                    onValueChange={(value) => updateProfile('activityLevel', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select activity level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedentary">Sedentary</SelectItem>
                      <SelectItem value="lightly_active">Lightly Active</SelectItem>
                      <SelectItem value="moderately_active">Moderately Active</SelectItem>
                      <SelectItem value="very_active">Very Active</SelectItem>
                      <SelectItem value="extra_active">Extra Active</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dietType">Diet Type</Label>
                  <Select 
                    value={profile.dietType} 
                    onValueChange={(value) => updateProfile('dietType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select diet type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vegetarian">Vegetarian</SelectItem>
                      <SelectItem value="non-vegetarian">Non-Vegetarian</SelectItem>
                      <SelectItem value="eggetarian">Eggetarian</SelectItem>
                      <SelectItem value="vegan">Vegan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="diabetesType">Diabetes Type</Label>
                  <Select 
                    value={profile.diabetesType || ''} 
                    onValueChange={(value) => updateProfile('diabetesType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select diabetes type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="type1">Type 1</SelectItem>
                      <SelectItem value="type2">Type 2</SelectItem>
                      <SelectItem value="prediabetes">Prediabetes</SelectItem>
                      <SelectItem value="gestational">Gestational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="bloodSugarLevels">Recent Blood Sugar Levels (mg/dL)</Label>
                  <Input 
                    id="bloodSugarLevels" 
                    value={profile.bloodSugarLevels || ''}
                    onChange={(e) => updateProfile('bloodSugarLevels', e.target.value)}
                    placeholder="e.g., Fasting: 100, Post-meal: 140"
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <Label htmlFor="medicationDetails">Medication Details</Label>
                <Textarea 
                  id="medicationDetails" 
                  value={profile.medicationDetails || ''}
                  onChange={(e) => updateProfile('medicationDetails', e.target.value)}
                  placeholder="List any medications you take for diabetes or other conditions"
                  className="h-20"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <Label className="mb-2 block">Food Allergies</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {profile.allergies.map((item, index) => (
                      <div key={index} className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm">
                        <span>{item}</span>
                        <button 
                          onClick={() => removeFromList('allergies', index)}
                          className="ml-2 text-gray-500 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      id="allergies" 
                      placeholder="Add allergy"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          addToList('allergies', e.currentTarget.value)
                          e.currentTarget.value = ''
                        }
                      }}
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={(e) => {
                        const input = document.getElementById('allergies') as HTMLInputElement
                        if (input && input.value) {
                          addToList('allergies', input.value)
                          input.value = ''
                        }
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label className="mb-2 block">Food Preferences</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {profile.preferences.map((item, index) => (
                      <div key={index} className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm">
                        <span>{item}</span>
                        <button 
                          onClick={() => removeFromList('preferences', index)}
                          className="ml-2 text-gray-500 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      id="preferences" 
                      placeholder="Add preference"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          addToList('preferences', e.currentTarget.value)
                          e.currentTarget.value = ''
                        }
                      }}
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={(e) => {
                        const input = document.getElementById('preferences') as HTMLInputElement
                        if (input && input.value) {
                          addToList('preferences', input.value)
                          input.value = ''
                        }
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label className="mb-2 block">Food Avoidances</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {profile.avoidances.map((item, index) => (
                      <div key={index} className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm">
                        <span>{item}</span>
                        <button 
                          onClick={() => removeFromList('avoidances', index)}
                          className="ml-2 text-gray-500 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      id="avoidances" 
                      placeholder="Add avoidance"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          addToList('avoidances', e.currentTarget.value)
                          e.currentTarget.value = ''
                        }
                      }}
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={(e) => {
                        const input = document.getElementById('avoidances') as HTMLInputElement
                        if (input && input.value) {
                          addToList('avoidances', input.value)
                          input.value = ''
                        }
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={saveProfile}
                className="bg-blue-600 hover:bg-blue-700" 
              >
                Save Profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>This meal planner is designed to help manage diabetes through diet. Always consult with a healthcare professional before making significant changes to your diet.</p>
      </div>
    </div>
  )
}