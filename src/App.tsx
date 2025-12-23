import { useQuery } from "@tanstack/react-query"
import React, { useEffect, useState } from "react"
import { Route, BrowserRouter as Router, Routes } from "react-router-dom"

import { DashCommand } from "./components/DashCommand"
import DynamicBackground from "./components/DynamicBackground"
import ErrorBoundary from "./components/ErrorBoundary"
import Footer from "./components/Footer"
import Header, { RefreshToast } from "./components/Header"
import { useTheme } from "./hooks/use-theme"
import { InjectContext } from "./lib/inject"
import { fetchSetting } from "./lib/nezha-api"
import ErrorPage from "./pages/ErrorPage"
import NotFound from "./pages/NotFound"
import Server from "./pages/Server"
import ServerDetail from "./pages/ServerDetail"

const App: React.FC = () => {
  const { data: settingData, error } = useQuery({
    queryKey: ["setting"],
    queryFn: () => fetchSetting(),
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })
  const { setTheme } = useTheme()
  const [isCustomCodeInjected, setIsCustomCodeInjected] = useState(false)

  useEffect(() => {
    if (settingData?.data?.config?.custom_code) {
      InjectContext(settingData?.data?.config?.custom_code)
      setIsCustomCodeInjected(true)
    }
  }, [settingData?.data?.config?.custom_code])

  // 检测是否强制指定了主题颜色
  const forceTheme =
    // @ts-expect-error ForceTheme is a global variable
    typeof window !== "undefined" && window.ForceTheme && window.ForceTheme !== "" ? window.ForceTheme : undefined

  useEffect(() => {
    if (forceTheme === "dark" || forceTheme === "light") {
      setTheme(forceTheme)
    }
  }, [forceTheme, setTheme])

  if (error) {
    return <ErrorPage code={500} message={error.message} />
  }

  if (!settingData) {
    return null
  }

  if (settingData?.data?.config?.custom_code && !isCustomCodeInjected) {
    return null
  }

  return (
    <Router basename={import.meta.env.BASE_URL}>
      <ErrorBoundary>
        <div className="min-h-screen relative">
          {/* 动态背景层 */}
          <DynamicBackground />

          <main className="flex min-h-screen flex-col gap-4 p-4 md:p-8 relative z-10">
            <RefreshToast />
            <Header />
            <DashCommand />
            <div className="flex-1">
              <Routes>
                <Route path="/" element={<Server />} />
                <Route path="/server/:id" element={<ServerDetail />} />
                <Route path="/error" element={<ErrorPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <Footer />
          </main>
        </div>
      </ErrorBoundary>
    </Router>
  )
}

export default App
