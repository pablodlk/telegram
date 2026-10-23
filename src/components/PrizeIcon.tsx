import React from 'react';
import {
  Car,
  Plane,
  Ticket,
  Banknote,
  Trophy,
  Smartphone,
  Microwave,
  Gift,
  Watch,
  Headphones,
  BatteryCharging,
  Coffee,
  Sparkles,
} from 'lucide-react';

interface PrizeIconProps {
  name?: string;
  className?: string;
}

export const PrizeIcon: React.FC<PrizeIconProps> = ({ name, className = 'w-6 h-6' }) => {
  const iconKey = (name || '').toLowerCase();

  switch (iconKey) {
    case 'car':
    case 'avto':
    case 'mashina':
      return <Car className={className} />;
    case 'plane':
    case 'umra':
    case 'travel':
      return <Plane className={className} />;
    case 'ticket':
    case 'sanatoriy':
    case 'vaucher':
      return <Ticket className={className} />;
    case 'banknote':
    case 'money':
    case 'pul':
    case 'cash':
      return <Banknote className={className} />;
    case 'trophy':
    case 'konkurs':
    case 'award':
      return <Trophy className={className} />;
    case 'smartphone':
    case 'iphone':
    case 'phone':
      return <Smartphone className={className} />;
    case 'microwave':
    case 'pech':
      return <Microwave className={className} />;
    case 'watch':
      return <Watch className={className} />;
    case 'headphones':
      return <Headphones className={className} />;
    case 'battery-charging':
    case 'powerbank':
      return <BatteryCharging className={className} />;
    case 'coffee':
    case 'termos':
      return <Coffee className={className} />;
    case 'sparkles':
      return <Sparkles className={className} />;
    case 'gift':
    default:
      return <Gift className={className} />;
  }
};
