import { Link } from '@inertiajs/react';

export default function NavLink({
    active = false,
    className = '',
    children,
    ...props
}) {
    return (
        <Link
            {...props}
            className={
                'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium leading-5 transition duration-150 ease-in-out focus:outline-none ' +
                (active
                    ? 'border-shopee text-shopee-dark focus:border-shopee-hover'
                    : 'border-transparent text-gray-400 hover:border-gray-200 hover:text-gray-600 focus:border-gray-200 focus:text-gray-600') +
                className

            }
        >
            {children}
        </Link>
    );
}
