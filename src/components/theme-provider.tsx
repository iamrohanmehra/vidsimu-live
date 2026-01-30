import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "dark",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
}: ThemeProviderProps) {
  const [theme] = useState<Theme>("dark")

  useEffect(() => {
    const root = window.document.documentElement

    // Remove light class if it exists (failsafe)
    root.classList.remove("light")
    
    // Always add dark class
    root.classList.add("dark")
  }, [])

  const value = {
    theme,
    setTheme: () => {
      // No-op: preventing theme changes
      console.warn("Theme switching is disabled. Dark mode is enforced.")
    },
  }

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
