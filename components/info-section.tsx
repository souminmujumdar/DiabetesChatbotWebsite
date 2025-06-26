import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function InfoSection() {
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Define the diabetes types information
  const diabetesTypes = [
    {
      title: "Type 1 Diabetes",
      description: "Autoimmune condition",
      content:
        "Type 1 diabetes is an autoimmune reaction that stops your body from making insulin. About 5-10% of people with diabetes have type 1. Symptoms often develop quickly and it's usually diagnosed in children, teens, and young adults.",
      color: "bg-blue-50",
      hoverColor: "hover:bg-blue-100",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6 text-blue-600"
        >
          <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" />
          <path d="M3 11v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2Z" />
          <path d="M12 11v8" />
          <path d="M8 11v2" />
          <path d="M16 11v2" />
        </svg>
      ),
    },
    {
      title: "Type 2 Diabetes",
      description: "Insulin resistance",
      content:
        "With type 2 diabetes, your body doesn't use insulin well and can't keep blood sugar at normal levels. About 90-95% of people with diabetes have type 2. It develops over many years and is usually diagnosed in adults.",
      color: "bg-green-50",
      hoverColor: "hover:bg-green-100",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6 text-green-600"
        >
          <path d="m8 2 1.5 1.5" />
          <path d="M14 2l1.5 1.5" />
          <path d="M9 7.5V4" />
          <path d="M15 7.5V4" />
          <path d="M7.5 9h9" />
          <path d="M11.52 12H6.38" />
          <path d="M16.54 18a5 5 0 1 1-9.08 0" />
        </svg>
      ),
    },
    {
      title: "Gestational Diabetes",
      description: "During pregnancy",
      content:
        "Gestational diabetes develops in pregnant women who have never had diabetes. If you have gestational diabetes, your baby could be at higher risk for health complications. It usually goes away after the baby is born.",
      color: "bg-purple-50",
      hoverColor: "hover:bg-purple-100",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6 text-purple-600"
        >
          <path d="M12 10c-3.314 0-6-2.686-6-6h12c0 3.314-2.686 6-6 6z" />
          <path d="M12 10v12" />
          <path d="M9 13h6" />
          <path d="M9 17h6" />
        </svg>
      ),
    },
  ];

  // Define tabs content
  const tabsContent = [
    {
      id: "symptoms",
      title: "Symptoms",
      items: [
        "Increased thirst and urination",
        "Extreme hunger",
        "Unexplained weight loss",
        "Fatigue and weakness",
        "Blurred vision",
        "Slow-healing sores",
        "Frequent infections",
      ],
    },
    {
      id: "risk-factors",
      title: "Risk Factors",
      items: [
        "Family history of diabetes",
        "Overweight or obesity",
        "Physical inactivity",
        "Age (risk increases with age)",
        "High blood pressure",
        "Abnormal cholesterol levels",
        "History of gestational diabetes",
      ],
    },
    {
      id: "complications",
      title: "Potential Complications",
      items: [
        "Heart disease and stroke",
        "Nerve damage (neuropathy)",
        "Kidney damage (nephropathy)",
        "Eye damage (retinopathy)",
        "Foot damage",
        "Skin conditions",
        "Hearing impairment",
      ],
    },
  ];

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <section id="about" className="w-full py-12 md:py-24 bg-white">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-blue-700">
              Understanding Diabetes
            </h2>
            <p className="max-w-[900px] text-gray-600 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Diabetes is a chronic health condition that affects how your body
              turns food into energy. Learn about the different types, symptoms,
              and management strategies.
            </p>
          </div>
        </div>

        <div className="mx-auto mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {diabetesTypes.map((type, index) => (
            <div
              key={`diabetes-type-${index}`}
              onMouseEnter={() => setActiveCard(index)}
              onMouseLeave={() => setActiveCard(null)}
            >
              <Card
                className={`transition-all duration-300 ${type.color} ${type.hoverColor} h-full border-2 ${
                  activeCard === index ? "border-blue-300" : "border-transparent"
                }`}
              >
                <CardHeader className="flex flex-row items-center space-x-2">
                  <div className="rounded-full p-2 bg-white">{type.icon}</div>
                  <div>
                    <CardTitle>{type.title}</CardTitle>
                    <CardDescription>{type.description}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="transition-all duration-300">{type.content}</p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        <div className="mt-16">
          <Tabs defaultValue="symptoms" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              {tabsContent.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="transition-all duration-300 hover:bg-blue-50"
                >
                  {tab.title}
                </TabsTrigger>
              ))}
            </TabsList>

            {tabsContent.map((tab) => (
              <TabsContent
                key={tab.id}
                value={tab.id}
                className="p-4 border rounded-md mt-2 transition-all duration-300"
              >
                <h3 className="text-lg font-semibold mb-2">{tab.title}</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {tab.items
                    .slice(0, isExpanded ? tab.items.length : 5)
                    .map((item, i) => (
                      <li
                        key={`${tab.id}-item-${i}`}
                        className="cursor-default transition-all duration-200 hover:text-blue-700"
                      >
                        {item}
                      </li>
                    ))}
                </ul>
                {tab.items.length > 5 && (
                  <button
                    onClick={toggleExpand}
                    className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    {isExpanded ? "Show less" : "Show more"}
                  </button>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </section>
  );
}