# Bliyyan

Bliyyan is a modern e-commerce marketplace built on the Laravel framework, specifically designed to integrate with the Pi Network ecosystem. This project aims to provide a seamless and secure shopping experience for Pi users, leveraging the Pi Network's decentralized technology and PiOS open-source principles.

## Project Details
- **Category**: E-commerce / Marketplace
- **Description**: A premium marketplace for electronics and digital goods, allowing users to purchase items exclusively using Pi Network cryptocurrency.
- **Programming Languages**: PHP, JavaScript (React)
- **Frameworks**: Laravel 12, Inertia.js, Tailwind CSS
- **Pi Network Integration**: Official Pi SDK for authentication and payments.

## Features
- **Pi Network Integration**: Built-in support for Pi payments and authentication.
- **Modern Admin Panel**: Premium user interface for managing products, categories, and groups.
- **Real-time Search & Filters**: Faster and more intuitive catalog browsing.
- **Image Optimization**: Automated processing with high-quality compression (~200KB per image).
- **Responsive Design**: Consistent experience across all devices.

## PiOS (Pi Open Source)
This project is part of the **PiOS (Pi Open Source)** initiative. It is developed for and exclusively for use within the official Pi Network ecosystem.

## Installation & Setup
1. Clone the repository.
2. Install PHP dependencies: `composer install`
3. Install JS dependencies: `npm install`
4. Set up your `.env` file with Pi Network credentials and database settings.
5. Generate app key: `php artisan key:generate`
6. Run migrations & seeders: `php artisan migrate:fresh --seed`
7. Compile assets: `npm run build`
8. Start the server: `php artisan serve`

---

## Disclaimer
Pi, Pi Network and the Pi logo are trademarks of the Pi Community Company.

## License
This application is open-sourced software licensed under the **[PiOS License](LICENSE)**.
