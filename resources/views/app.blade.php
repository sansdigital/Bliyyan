<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'Bliyyan') }}</title>

        <!-- Fonts -->
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />

        <!-- Favicon -->
        <link rel="icon" href="/images/logonet.png" type="image/png">
        <link rel="icon" href="/favicon.ico" type="image/x-icon">

        <!-- Pi SDK -->
        <script src="https://sdk.minepi.com/pi-sdk.js"></script>
        <script>Pi.init({ version: "2.0", sandbox: {{ config('services.pi.sandbox') ? 'true' : 'false' }} })</script>


        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
