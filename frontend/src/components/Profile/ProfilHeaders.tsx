import { ChevronDown } from 'lucide-react';

type windowType ={ request: boolean; prefsOpen: boolean; secureOpen: boolean; accountOpen: boolean; }
type propsType = {
    value : boolean;
    title: string;
    name: keyof windowType
    setWindow: React.Dispatch<React.SetStateAction<windowType>>;
}
export default function ProfilHeader ({title, name, setWindow, value} : propsType) {
    
    return (
        <header className={`flex cursor-grab items-center justify-between ${value ? 'mb-3' : ''}`}
                onClick={() => setWindow(prev => ( { ...prev, [name]: !value } ))}
        >
        <h3 className="pf-title">{title}</h3>
        <ChevronDown size={18} className={`pf-chevron ${value ? 'pf-chevron-open' : ''}`} />
    
        </header>
    )
}