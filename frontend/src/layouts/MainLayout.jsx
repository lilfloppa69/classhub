import Header from '../components/layout/Header'
import Sidebar from '../components/layout/Sidebar'
import ClassHeader from '../components/layout/ClassHeader'
import React, { useState } from 'react'

export default function MainLayout({
  children,
  hideHeader = false,
  headerVariant = 'default',
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [activeClassTab, setActiveClassTab] = useState('assignments')

  const sidebarWidthClass = isSidebarCollapsed ? 'ml-[84px]' : 'ml-[190px]'

  return (
    <div className="min-h-screen bg-[#F3EDED]">
      {!hideHeader &&
        (headerVariant === 'class' ? (
          <ClassHeader
            isSidebarCollapsed={isSidebarCollapsed}
            setIsSidebarCollapsed={setIsSidebarCollapsed}
            activeTab={activeClassTab}
            onTabChange={setActiveClassTab}
          />
        ) : (
          <Header
            isSidebarCollapsed={isSidebarCollapsed}
            setIsSidebarCollapsed={setIsSidebarCollapsed}
            activeTab={activeClassTab}
            onTabChange={setActiveClassTab}
          />
        ))}

      <Sidebar isCollapsed={isSidebarCollapsed} />

      <main
        className={`min-h-screen px-8 pb-6 pt-[112px] transition-all duration-300 ${sidebarWidthClass}`}
      >
        {React.isValidElement(children)
          ? React.cloneElement(children, {
              activeTab: activeClassTab,
            })
          : children}
      </main>
    </div>
  )
}
