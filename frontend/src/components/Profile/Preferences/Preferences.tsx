import { Globe, Music2, Sun, Moon, Image as ImageIcon } from 'lucide-react';
import { useAuth } from "@/src/components/Provider/UserProvider";
import LanguageSelector from './LanguageSelector';
import AvatarSelector from './AvatarSelector';
import ThemeToggle from './ThemeToggle';
import VolumeControl from '../../Music/VolumeControl';
import SnakeColorSelector from './SnakeColorSelector';

export default function Preferences () {
    const { cntUser, LENUAGE } = useAuth();
    const PF_LENG = LENUAGE.Profile;

    return (
        <div className="pf-rows">
            <div className="pf-row">
                <div className="pf-lbl">
                    <span className="pf-iconWrap">
                        <Globe size={16} />
                    </span>
                    {PF_LENG.settings.lang}
                </div>
                <LanguageSelector />
            </div>

            <div className="pf-row">
                <div className="pf-lbl">
                    <span className="pf-iconWrap">{cntUser?.theme ?? true ? <Sun size={16} /> : <Moon size={16} />}</span>
                    {PF_LENG.settings.ct}
                </div>
                <ThemeToggle />
            </div>

            <div className="pf-row">
                <div className="pf-lbl">
                    <span className="pf-iconWrap"><Music2 size={16} /></span>
                    {PF_LENG.settings.sound}
                </div>
                <VolumeControl musicName='snake_music_on'/>
            </div>

            <div className="pf-row pf-rowStack">
                <div className="pf-lbl">
                    <span className="pf-iconWrap">
                        <ImageIcon size={16} />
                    </span>
                    {PF_LENG.settings.avatar}
                </div>
                <div className="pf-val">
                    <AvatarSelector />
                </div>
            </div>
            <SnakeColorSelector />
        </div>
    )
}