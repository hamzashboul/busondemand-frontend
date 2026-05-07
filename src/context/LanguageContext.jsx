import { createContext, useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'

const LanguageContext = createContext()

export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation()
  const [isArabic, setIsArabic] = useState(
    localStorage.getItem('language') === 'ar'
  )

  const toggleLanguage = () => {
    const newLang = isArabic ? 'en' : 'ar'
    i18n.changeLanguage(newLang)
    localStorage.setItem('language', newLang)
    setIsArabic(!isArabic)
    document.dir = newLang === 'ar' ? 'rtl' : 'ltr'
  }

  // Set initial direction
  document.dir = isArabic ? 'rtl' : 'ltr'

  return (
    <LanguageContext.Provider value={{ isArabic, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)