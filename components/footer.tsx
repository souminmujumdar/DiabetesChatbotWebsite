import Link from "next/link"

export function Footer() {
  return (
    <footer className="w-full py-6 bg-gray-900 text-gray-100">
      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">DiabetesGuide</h3>
            <p className="text-sm text-gray-400">
              Providing comprehensive information and support for people living with diabetes.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#about" className="hover:text-blue-400 transition-colors">
                  About Diabetes
                </Link>
              </li>
              <li>
                <Link href="#types" className="hover:text-blue-400 transition-colors">
                  Types of Diabetes
                </Link>
              </li>
              <li>
                <Link href="#management" className="hover:text-blue-400 transition-colors">
                  Management Strategies
                </Link>
              </li>
              <li>
                <Link href="#resources" className="hover:text-blue-400 transition-colors">
                  Resources
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="hover:text-blue-400 transition-colors">
                  Articles
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-blue-400 transition-colors">
                  Videos
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-blue-400 transition-colors">
                  Recipes
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-blue-400 transition-colors">
                  Community
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="hover:text-blue-400 transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-blue-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-blue-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-800 pt-6 text-center text-sm text-gray-400">
          <p>© {new Date().getFullYear()} DiabetesGuide. All rights reserved.</p>
          <p className="mt-2">
            This website is for informational purposes only and is not a substitute for medical advice, diagnosis, or
            treatment.
          </p>
        </div>
      </div>
    </footer>
  )
}