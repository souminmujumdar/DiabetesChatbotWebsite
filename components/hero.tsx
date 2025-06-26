'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, Search, ArrowRight, Info, Book, Calendar, Users } from "lucide-react"

export function Hero() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isResourcesOpen, setIsResourcesOpen] = useState(false)
  const [selectedResource, setSelectedResource] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredResources, setFilteredResources] = useState([])
  
  // Handle escape key press for modals
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        if (isModalOpen) closeModal();
        if (isResourcesOpen) closeResources();
      }
    };
    
    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [isModalOpen, isResourcesOpen]);

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => setIsModalOpen(false)
  
  const openResources = () => setIsResourcesOpen(true)
  const closeResources = () => {
    setIsResourcesOpen(false)
    setSelectedResource(null)
  }

  const selectResource = (resource) => {
    setSelectedResource(resource)
  }

  // Filter resources based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredResources(resources);
    } else {
      const filtered = resources.filter(resource => 
        resource.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        resource.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredResources(filtered);
    }
  }, [searchQuery]);
  
  const resources = [
    {
      id: 1,
      title: "Diabetes Management Guide",
      description: "A comprehensive guide to daily diabetes management, including diet, exercise, and medication.",
      icon: <Book className="h-10 w-10 text-blue-600" />,
      link: "/resources/diabetes-guide",
      content: "This guide provides daily management strategies, meal planning templates, exercise routines, and medication tracking tools specifically designed for people with diabetes.",
      steps: [
        "Download the guide PDF",
        "Complete the self-assessment quiz",
        "Create your personalized management plan",
        "Schedule regular check-ins"
      ]
    },
    {
      id: 2,
      title: "Local Support Groups",
      description: "Find diabetes support groups in your area for shared experiences and advice.",
      icon: <Users className="h-10 w-10 text-blue-600" />,
      link: "/resources/support-groups",
      content: "Connect with others who understand the challenges of living with diabetes. Our support groups offer emotional support, practical advice, and community resources.",
      steps: [
        "Enter your location to find nearby groups",
        "Browse available meeting times",
        "Register for your first session",
        "Connect with group members"
      ]
    },
    {
      id: 3,
      title: "Upcoming Webinars",
      description: "Join our educational webinars on the latest diabetes research and management techniques.",
      icon: <Calendar className="h-10 w-10 text-blue-600" />,
      link: "/resources/webinars",
      content: "Stay up-to-date with the latest in diabetes research and management through our expert-led webinars. Topics include new treatments, nutrition research, and lifestyle strategies.",
      steps: [
        "Browse upcoming webinar schedule",
        "Register for sessions that interest you",
        "Receive calendar invites and reminders",
        "Access recorded sessions if you miss one"
      ]
    }
  ]

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-r from-blue-50 to-green-50">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl text-blue-700">
              Living Well With Diabetes
            </h1>
            <p className="max-w-[600px] text-gray-600 md:text-xl">
              Comprehensive information, resources, and AI-powered guidance to help you manage diabetes effectively and
              live a healthy, fulfilling life.
            </p>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 transition-transform hover:scale-105"
                onClick={openModal}
              >
                Learn More
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="hover:bg-blue-100 transition-transform hover:scale-105"
                onClick={openResources}
              >
                Find Resources
              </Button>
            </div>
          </div>
          <div className="flex justify-center">
            {/* Using an SVG-based illustration to ensure it loads */}
            <div className="rounded-lg bg-blue-100 w-full max-w-[400px] h-[400px] flex items-center justify-center text-blue-700 overflow-hidden">
              <svg viewBox="0 0 400 400" className="w-full h-full">
                <rect width="400" height="400" fill="#e6f2ff" />
                <circle cx="200" cy="130" r="70" fill="#3b82f6" opacity="0.2" />
                <circle cx="200" cy="130" r="50" fill="#3b82f6" opacity="0.4" />
                <circle cx="200" cy="130" r="30" fill="#3b82f6" opacity="0.6" />
                
                {/* Simplified person */}
                <circle cx="200" cy="120" r="20" fill="#60a5fa" />
                <rect x="185" y="145" width="30" height="90" fill="#60a5fa" />
                <rect x="160" y="150" width="80" height="20" rx="10" fill="#60a5fa" />
                <rect x="185" y="240" width="15" height="60" rx="5" fill="#60a5fa" />
                <rect x="200" y="240" width="15" height="60" rx="5" fill="#60a5fa" />
                
                {/* Simplified health icons */}
                <g transform="translate(100, 280)">
                  <circle cx="0" cy="0" r="30" fill="#34d399" opacity="0.7" />
                  <path d="M-15,0 L15,0 M0,-15 L0,15" stroke="white" strokeWidth="6" />
                </g>
                <g transform="translate(300, 280)">
                  <circle cx="0" cy="0" r="30" fill="#f87171" opacity="0.7" />
                  <path d="M-15,-15 C-5,0 -5,0 0,15 C5,0 5,0 15,-15" stroke="white" strokeWidth="6" fill="none" />
                </g>
                
                {/* Text */}
                <text x="200" y="350" textAnchor="middle" fill="#1e40af" fontSize="20" fontWeight="bold">
                  Healthy Living
                </text>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Information Modal (replaced video with informational content) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 transform transition-all duration-300 scale-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-blue-700">Understanding Diabetes</h2>
              <Button variant="ghost" size="sm" onClick={closeModal} aria-label="Close modal">
                <X className="h-6 w-6" />
              </Button>
            </div>
            <div className="space-y-4">
              <p className="text-gray-600">
                Diabetes affects millions worldwide, but with the right knowledge and tools, you can lead a healthy life.
              </p>
              
              {/* Informational content instead of video */}
              <div className="space-y-4 bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start">
                  <div className="mr-3 mt-1">
                    <Info className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-800">What is Diabetes?</h3>
                    <p className="text-sm text-gray-600">Diabetes is a chronic condition that affects how your body turns food into energy. Most food you eat is broken down into sugar and released into your bloodstream. When blood sugar goes up, it signals your pancreas to release insulin.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mr-3 mt-1">
                    <Info className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-800">Types of Diabetes</h3>
                    <p className="text-sm text-gray-600">There are several types of diabetes, including Type 1, Type 2, and gestational diabetes. Each type has different causes and may require different management approaches.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mr-3 mt-1">
                    <Info className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-800">Living with Diabetes</h3>
                    <p className="text-sm text-gray-600">With proper management, people with diabetes can lead long, healthy lives. This includes regular monitoring of blood sugar levels, taking prescribed medications, following a balanced diet, and getting regular physical activity.</p>
                  </div>
                </div>
              </div>
              
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={closeModal}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Resources Modal (Functional "Find Resources" button) */}
      {isResourcesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 transform transition-all duration-300 scale-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-blue-700">Diabetes Resources</h2>
              <Button variant="ghost" size="sm" onClick={closeResources} aria-label="Close resources">
                <X className="h-6 w-6" />
              </Button>
            </div>
            
            {!selectedResource ? (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search resources..." 
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredResources.length > 0 ? filteredResources.map((resource) => (
                    <div 
                      key={resource.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => selectResource(resource)}
                    >
                      <div className="flex flex-col items-center text-center">
                        {resource.icon}
                        <h3 className="mt-2 font-medium text-gray-900">{resource.title}</h3>
                        <p className="mt-1 text-sm text-gray-500">{resource.description}</p>
                        <Button 
                          variant="ghost" 
                          className="mt-3 text-blue-600 hover:text-blue-800"
                          onClick={(e) => {
                            e.stopPropagation();
                            selectResource(resource);
                          }}
                        >
                          View Details <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )) : (
                    <div className="col-span-3 py-10 text-center">
                      <p className="text-gray-500">No resources match your search.</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setSearchQuery("")}
                      >
                        Clear Search
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="flex mt-4 space-x-4">
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={() => window.alert("In a real app, this would show more resources!")}
                  >
                    Load More Resources
                  </Button>
                  <Button
                    className="flex-1 bg-gray-600 hover:bg-gray-700"
                    onClick={closeResources}
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Button
                  variant="outline"
                  className="mb-4"
                  onClick={() => setSelectedResource(null)}
                >
                  Back to All Resources
                </Button>
                
                <div className="bg-blue-50 p-6 rounded-lg">
                  <div className="flex flex-col items-center mb-6">
                    {selectedResource.icon}
                    <h2 className="mt-4 text-2xl font-bold text-blue-800">{selectedResource.title}</h2>
                  </div>
                  
                  <p className="text-gray-700 mb-6">{selectedResource.description}</p>
                  
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded border border-gray-200">
                      <h3 className="font-medium text-blue-700 mb-2">How This Resource Helps</h3>
                      <p className="text-gray-600 text-sm">{selectedResource.content}</p>
                    </div>
                    
                    <div className="bg-white p-4 rounded border border-gray-200">
                      <h3 className="font-medium text-blue-700 mb-2">Getting Started</h3>
                      <ul className="text-gray-600 text-sm list-disc pl-5 space-y-1">
                        {selectedResource.steps.map((step, index) => (
                          <li key={index}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                      onClick={() => window.alert(`Accessing ${selectedResource.title}! In a real app, this would go to: ${selectedResource.link}`)}
                    >
                      Access Resource
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full sm:w-auto"
                      onClick={() => setSelectedResource(null)}
                    >
                      View Other Resources
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}