import { 
  Zap, 
  Snowflake, 
  Coins, 
  Rocket, 
  Sparkles, 
  Flame, 
  Heart, 
  Star,
  Crown,
  Target,
  Trophy,
  CheckCircle2,
  Sword,
  Shield,
  Calendar,
  TrendingUp,
  Award,
  Medal,
  Gem,
  Sun,
  Moon,
  Wand2,
  Feather,
  Palette,
  Music,
  Gamepad2,
  Headphones,
  Mic,
  Video,
  Camera,
  Film,
  Radio,
  Users,
  UserPlus,
  Gift,
  BadgeCheck,
  Sparkle,
  CircleDot,
  Hexagon,
  Diamond,
  Clover,
  Flower2,
  LeafyGreen,
  Footprints,
  Mountain,
  Waves,
  Briefcase,
  Hash,
  Sunrise,
  Bird,
  Cloud
} from 'lucide-react'

export type IconName = 
  | 'zap' | 'zap-double' | 'zap-triple'
  | 'snowflake' | 'snowflake-double'
  | 'coins' | 'coins-double'
  | 'rocket'
  | 'sparkles' | 'sparkle'
  | 'flame' | 'fire-aura'
  | 'heart' | 'rainbow'
  | 'star' | 'stars'
  | 'crown' | 'crown-legendary'
  | 'target'
  | 'trophy' | 'trophy-gold'
  | 'check' | 'check-double'
  | 'sword' | 'sword-double'
  | 'shield'
  | 'calendar'
  | 'trending'
  | 'award'
  | 'medal' | 'medal-silver' | 'medal-gold'
  | 'gem' | 'diamond'
  | 'sun' | 'moon'
  | 'wand'
  | 'feather' | 'seedling'
  | 'palette'
  | 'music'
  | 'gamepad'
  | 'headphones'
  | 'microphone'
  | 'video' | 'camera' | 'film'
  | 'radio'
  | 'users' | 'user-plus'
  | 'gift'
  | 'badge'
  | 'hexagon'
  | 'clover'
  | 'flower'
  | 'footprints'
  | 'mountain'
  | 'waves'
  | 'briefcase'
  | 'hundred'
  | 'sunrise'
  | 'bird'
  | 'cloud'

interface IconMapperProps {
  icon: IconName
  className?: string
  size?: number
}

export function IconMapper({ icon, className = '', size = 24 }: IconMapperProps) {
  const iconProps = { size, className }

  const iconMap: Record<IconName, JSX.Element> = {
    // Power-ups
    'zap': <Zap {...iconProps} />,
    'zap-double': <div className="relative"><Zap {...iconProps} /><Zap {...iconProps} className={`absolute top-0 left-0 ${className} opacity-50`} /></div>,
    'zap-triple': <div className="relative"><Zap {...iconProps} /><Zap {...iconProps} className={`absolute -top-1 -left-1 ${className} opacity-30`} /></div>,
    
    // Ice/Freeze
    'snowflake': <Snowflake {...iconProps} />,
    'snowflake-double': <div className="relative"><Snowflake {...iconProps} /><Snowflake {...iconProps} className={`absolute top-0.5 left-0.5 ${className} opacity-40`} /></div>,
    
    // Money
    'coins': <Coins {...iconProps} />,
    'coins-double': <div className="relative"><Coins {...iconProps} /><Coins {...iconProps} className={`absolute top-0.5 left-0.5 ${className} opacity-40`} /></div>,
    
    // Level/Speed
    'rocket': <Rocket {...iconProps} />,
    
    // Effects
    'sparkles': <Sparkles {...iconProps} />,
    'sparkle': <Sparkle {...iconProps} />,
    'flame': <Flame {...iconProps} />,
    'fire-aura': <div className="relative"><Flame {...iconProps} /><Sparkles {...iconProps} className={`absolute -top-1 -right-1 ${className} opacity-60`} /></div>,
    
    // Decoration
    'heart': <Heart {...iconProps} />,
    'rainbow': <Waves {...iconProps} />,
    'star': <Star {...iconProps} />,
    'stars': <div className="relative"><Star {...iconProps} /><Star size={size * 0.6} className={`absolute -top-1 -right-1 ${className} opacity-60`} /></div>,
    
    // Crown/Royal
    'crown': <Crown {...iconProps} />,
    'crown-legendary': <div className="relative"><Crown {...iconProps} /><Sparkles size={size * 0.5} className={`absolute -top-1 -right-1 ${className}`} /></div>,
    
    // Goals/Achievements
    'target': <Target {...iconProps} />,
    'trophy': <Trophy {...iconProps} />,
    'trophy-gold': <div className="relative"><Trophy {...iconProps} /><Star size={size * 0.4} className={`absolute -top-1 -right-1 ${className} opacity-80`} /></div>,
    
    // Tasks
    'check': <CheckCircle2 {...iconProps} />,
    'check-double': <div className="relative"><CheckCircle2 {...iconProps} /><CheckCircle2 {...iconProps} className={`absolute top-0.5 left-0.5 ${className} opacity-40`} /></div>,
    
    // Combat/Strength
    'sword': <Sword {...iconProps} />,
    'sword-double': <div className="relative"><Sword {...iconProps} /><Sword {...iconProps} className={`absolute top-0.5 -left-1 ${className} opacity-30 -rotate-12`} /></div>,
    'shield': <Shield {...iconProps} />,
    
    // Time/Calendar
    'calendar': <Calendar {...iconProps} />,
    
    // Progress
    'trending': <TrendingUp {...iconProps} />,
    
    // Rewards
    'award': <Award {...iconProps} />,
    'medal': <Medal {...iconProps} />,
    'medal-silver': <Medal {...iconProps} className={`${className} text-gray-400`} />,
    'medal-gold': <Medal {...iconProps} className={`${className} text-yellow-500`} />,
    
    // Precious
    'gem': <Gem {...iconProps} />,
    'diamond': <Diamond {...iconProps} />,
    
    // Nature/Day
    'sun': <Sun {...iconProps} />,
    'moon': <Moon {...iconProps} />,
    'seedling': <LeafyGreen {...iconProps} />,
    'feather': <Feather {...iconProps} />,
    'clover': <Clover {...iconProps} />,
    'flower': <Flower2 {...iconProps} />,
    
    // Magic
    'wand': <Wand2 {...iconProps} />,
    
    // Art/Theme
    'palette': <Palette {...iconProps} />,
    
    // Entertainment
    'music': <Music {...iconProps} />,
    'gamepad': <Gamepad2 {...iconProps} />,
    'headphones': <Headphones {...iconProps} />,
    'microphone': <Mic {...iconProps} />,
    
    // Streaming
    'video': <Video {...iconProps} />,
    'camera': <Camera {...iconProps} />,
    'film': <Film {...iconProps} />,
    'radio': <Radio {...iconProps} />,
    
    // Social
    'users': <Users {...iconProps} />,
    'user-plus': <UserPlus {...iconProps} />,
    
    // Special
    'gift': <Gift {...iconProps} />,
    'badge': <BadgeCheck {...iconProps} />,
    'hexagon': <Hexagon {...iconProps} />,
    'footprints': <Footprints {...iconProps} />,
    'mountain': <Mountain {...iconProps} />,
    'waves': <Waves {...iconProps} />,
    
    // Additional
    'briefcase': <Briefcase {...iconProps} />,
    'hundred': <Hash {...iconProps} />,
    'sunrise': <Sunrise {...iconProps} />,
    'bird': <Bird {...iconProps} />,
    'cloud': <Cloud {...iconProps} />
  }

  return iconMap[icon] || <CircleDot {...iconProps} />
}
