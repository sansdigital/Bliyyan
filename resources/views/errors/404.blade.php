<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 — Halaman Tidak Ditemukan | Bliyyan</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Outfit', sans-serif;
            background: #f9f9f9;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 2rem;
        }
        .container { max-width: 480px; width: 100%; }
        .badge {
            display: inline-block;
            background: #ee4d2d;
            color: white;
            font-weight: 900;
            font-size: 0.65rem;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            padding: 0.35rem 0.9rem;
            border-radius: 100px;
            margin-bottom: 2rem;
        }
        .code {
            font-size: 7rem;
            font-weight: 900;
            line-height: 1;
            background: linear-gradient(135deg, #ee4d2d, #ff7043);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 1rem;
        }
        h1 {
            font-size: 1.5rem;
            font-weight: 900;
            color: #1a1a1a;
            margin-bottom: 0.75rem;
        }
        p {
            color: #888;
            font-size: 0.95rem;
            line-height: 1.6;
            margin-bottom: 2.5rem;
        }
        .btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            background: #ee4d2d;
            color: white;
            font-weight: 700;
            font-size: 0.9rem;
            padding: 0.8rem 2rem;
            border-radius: 0.5rem;
            text-decoration: none;
            transition: background 0.2s, transform 0.2s;
        }
        .btn:hover { background: #d93e20; transform: translateY(-1px); }
        .icon {
            width: 100px;
            height: 100px;
            margin: 0 auto 2rem;
            background: linear-gradient(135deg, #fff5f3, #ffe0d9);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.8rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">🔍</div>
        <div class="badge">Error 404</div>
        <div class="code">404</div>
        <h1>Halaman Tidak Ditemukan</h1>
        <p>Halaman yang Anda cari mungkin sudah dipindahkan, dihapus, atau tidak pernah ada.<br>Yuk kembali ke beranda Bliyyan!</p>
        <a href="/" class="btn">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            Kembali ke Beranda
        </a>
    </div>
</body>
</html>
