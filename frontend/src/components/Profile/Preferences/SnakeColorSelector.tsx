'use client';
import { Palette } from 'lucide-react';
import { useAuth } from '@/src/components/Provider/UserProvider';


const SNAKE_COLORS = [
    '#22c55e', '#22d3ee', '#d946ef', '#f97316', '#fbbf24', '#ef4444', '#a3e635', '#f472b6'
]
export default function SnakeColorSelector() {
  const { cntUser, LENUAGE, ChangingCallback } = useAuth();
  const PF_LENG = LENUAGE.Profile.settings;
  
  return (
    <div className="pf-row pf-rowStack">
        <div className="pf-lbl">
          <span className="pf-iconWrap"><Palette size={16} /></span>
          {PF_LENG.snakeColor}
        </div>
        <div className="pf-val">
            <div className="pf-swatchGroup">
              {SNAKE_COLORS.map((color) => (

                <button key={color} type="button" aria-label={color}
                  className={`pf-swatch ${cntUser?.color === color ? 'pf-swatchActive' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={async () => ChangingCallback({color}, "change-color")}
                />
              ))}
            </div>
        </div>
    </div>
  );
}