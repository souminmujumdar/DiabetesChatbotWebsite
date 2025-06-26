'use client'

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, ChevronDown, ChevronUp, Heart, Globe, Award, Activity, Utensils, Pill, Users, UserPlus, Users2 } from "lucide-react"

export function ResourcesSection() {
  const [expandedCard, setExpandedCard] = useState<number | null>(null)

  const resources = [
    {
      title: "Organizations",
      description: "Trusted diabetes associations",
      items: [
        { name: "American Diabetes Association", url: "https://diabetes.org", icon: <Heart className="h-6 w-6 text-red-500" /> },
        { name: "International Diabetes Federation", url: "https://idf.org", icon: <Globe className="h-6 w-6 text-blue-500" /> },
        { name: "JDRF (Type 1 Diabetes)", url: "https://jdrf.org", icon: <Award className="h-6 w-6 text-amber-500" /> },
      ],
    },
    {
      title: "Tools & Apps",
      description: "Digital diabetes management",
      items: [
        { name: "MySugr Blood Sugar Tracker", url: "https://mysugr.com", icon: <Activity className="h-6 w-6 text-green-500" /> },
        { name: "CalorieKing Carb Counter", url: "https://calorieking.com", icon: <Utensils className="h-6 w-6 text-orange-500" /> },
        { name: "Medisafe Medication Reminders", url: "https://medisafe.com", icon: <Pill className="h-6 w-6 text-purple-500" /> },
      ],
    },
    {
      title: "Communities",
      description: "Connect with others",
      items: [
        { name: "Diabetes Daily Forums", url: "https://diabetesdaily.com", icon: <Users className="h-6 w-6 text-indigo-500" /> },
        { name: "Beyond Type 1 Support", url: "https://beyondtype1.org", icon: <UserPlus className="h-6 w-6 text-teal-500" /> },
        { name: "T1D Exchange Community", url: "https://t1dexchange.org", icon: <Users2 className="h-6 w-6 text-cyan-500" /> },
      ],
    },
  ]

  const toggleCard = (index: number) => {
    setExpandedCard(expandedCard === index ? null : index)
  }

  return (
    <section id="resources" className="w-full py-12 md:py-24 bg-blue-50">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-blue-700">
              Helpful Resources
            </h2>
            <p className="max-w-[900px] text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Access trusted resources, tools, and communities to help you manage diabetes effectively.
            </p>
          </div>
        </div>
        <div className="mx-auto mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource, index) => (
            <Card key={index} className="transition-all hover:shadow-lg">
              <CardHeader>
                <CardTitle>{resource.title}</CardTitle>
                <CardDescription>{resource.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {resource.items.slice(0, expandedCard === index ? undefined : 2).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {item.icon}
                      <span>{item.name}</span>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={item.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Visit
                      </a>
                    </Button>
                  </div>
                ))}
                {resource.items.length > 2 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => toggleCard(index)}
                  >
                    {expandedCard === index ? (
                      <>
                        Show Less <ChevronUp className="h-4 w-4 ml-2" />
                      </>
                    ) : (
                      <>
                        Show More <ChevronDown className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}