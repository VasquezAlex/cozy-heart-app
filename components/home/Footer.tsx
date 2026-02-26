import Link from "next/link"
import { motion } from "framer-motion"

export function Footer() {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ delay: 0.5 }} 
      className="text-center text-xs text-zinc-600 space-y-2"
    >
      <div className="flex justify-center gap-4">
        {["Privacy", "Terms", "Support"].map((link) => (
          <Link 
            key={link} 
            href={`/${link.toLowerCase()}`} 
            className="hover:text-zinc-400 transition-colors"
          >
            {link}
          </Link>
        ))}
      </div>
      <p>© {new Date().getFullYear()} Cozy Heart</p>
    </motion.div>
  )
}