export default function ApplicationLogo(props) {
    return (
        <div {...props} className={`flex items-center gap-2 sm:gap-3 transition-transform active:scale-95 ${props.className}`}>
            <img src="/images/logonet.png" alt="Logo" className="h-10 sm:h-12 w-auto drop-shadow-sm" />
            <span className="text-3xl sm:text-4xl font-black tracking-tighter text-slate-900 dark:text-white mt-1">Bliyyan</span>
        </div>
    );
}
