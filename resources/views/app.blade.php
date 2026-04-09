<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'Bliyyan') }}</title>

        <!-- Fonts -->
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />

        <!-- Favicon -->
        <link rel="icon" type="image/png" href="{{ asset('images/logonet.png') }}?v=2">
        <link rel="shortcut icon" type="image/png" href="{{ asset('images/logonet.png') }}?v=2">
        <link rel="apple-touch-icon" href="{{ asset('images/logonet.png') }}?v=2">

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
