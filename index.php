<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>GOD OF CASINO</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body {
            font-family: 'Poppins', sans-serif;
            background: linear-gradient(135deg, #0a0e1a 0%, #0d1f0d 50%, #1a0a2e 100%);
            min-height: 100vh;
            color: #fff;
            overflow-x: hidden;
        }
        
        /* Header */
        .header {
            background: rgba(0,0,0,0.4);
            backdrop-filter: blur(10px);
            padding: 12px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid rgba(255,255,255,0.08);
            position: sticky;
            top: 0;
            z-index: 100;
        }
        .logo {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .logo-icon {
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, #00d4aa, #00aa88);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
        }
        .logo-text {
            font-weight: 900;
            font-size: 16px;
            letter-spacing: 1px;
        }
        .logo-text span {
            background: linear-gradient(135deg, #00d4aa, #00ffcc);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .version {
            font-size: 10px;
            color: rgba(255,255,255,0.4);
            background: rgba(255,255,255,0.05);
            padding: 2px 8px;
            border-radius: 10px;
        }
        
        /* Status Bar */
        .status-bar {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            font-size: 11px;
            color: rgba(255,255,255,0.6);
        }
        .status-dot {
            width: 6px; height: 6px;
            background: #00d4aa;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
        }
        
        /* Quick Prediction Banner */
        .quick-pred {
            margin: 12px 16px;
            padding: 16px;
            background: linear-gradient(135deg, rgba(0,212,170,0.15), rgba(0,170,136,0.08));
            border: 1px solid rgba(0,212,170,0.2);
            border-radius: 16px;
            text-align: center;
        }
        .quick-pred-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: rgba(0,212,170,0.7);
            margin-bottom: 6px;
        }
        .quick-pred-coeff {
            font-size: 36px;
            font-weight: 900;
            color: #00d4aa;
            text-shadow: 0 0 20px rgba(0,212,170,0.3);
        }
        .quick-pred-game {
            font-size: 12px;
            color: rgba(255,255,255,0.5);
            margin-top: 4px;
        }
        
        /* Games Grid */
        .games-section {
            padding: 0 16px 16px;
        }
        .section-title {
            font-size: 13px;
            font-weight: 600;
            color: rgba(255,255,255,0.5);
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 12px;
            padding-left: 4px;
        }
        .games-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
        }
        .game-card {
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 16px;
            padding: 16px 12px;
            text-align: center;
            text-decoration: none;
            color: #fff;
            transition: all 0.3s;
            position: relative;
            overflow: hidden;
        }
        .game-card::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 3px;
            background: linear-gradient(90deg, var(--accent, #00d4aa), transparent);
        }
        .game-card:active {
            transform: scale(0.96);
        }
        .game-card:hover {
            border-color: rgba(0,212,170,0.3);
            background: rgba(0,212,170,0.05);
        }
        .game-icon {
            width: 48px;
            height: 48px;
            margin: 0 auto 10px;
            background: rgba(255,255,255,0.06);
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
        }
        .game-name {
            font-size: 12px;
            font-weight: 700;
            margin-bottom: 4px;
        }
        .game-provider {
            font-size: 10px;
            color: rgba(255,255,255,0.35);
        }
        .game-badge {
            position: absolute;
            top: 8px;
            right: 8px;
            font-size: 8px;
            padding: 2px 6px;
            border-radius: 6px;
            font-weight: 600;
        }
        .badge-live {
            background: rgba(255,59,48,0.2);
            color: #ff3b30;
        }
        .badge-new {
            background: rgba(0,212,170,0.2);
            color: #00d4aa;
        }
        
        /* Footer */
        .footer {
            text-align: center;
            padding: 24px 16px;
            color: rgba(255,255,255,0.2);
            font-size: 10px;
        }
        .footer a {
            color: #00d4aa;
            text-decoration: none;
        }
        
        /* Telegram Button */
        .tg-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            margin-top: 12px;
            padding: 10px 20px;
            background: #0088cc;
            color: #fff;
            border: none;
            border-radius: 12px;
            font-family: 'Poppins', sans-serif;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
        }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">
            <div class="logo-icon"><i class="fas fa-crown"></i></div>
            <div class="logo-text"><span>GOD OF CASINO</span></div>
        </div>
        <div class="version">v3.0</div>
    </div>

    <div class="status-bar">
        <div class="status-dot"></div>
        <span>Moteur de prediction actif</span>
    </div>

    <div class="quick-pred" id="quickPred">
        <div class="quick-pred-label">Prediction Rapide</div>
        <div class="quick-pred-coeff" id="quickCoeff">x--</div>
        <div class="quick-pred-game" id="quickGame">Selectionnez un jeu</div>
    </div>

    <div class="games-section">
        <div class="section-title"><i class="fas fa-fire" style="color:#ff6b35;margin-right:6px"></i>Jeux Crash</div>
        <div class="games-grid">
            <a href="games/luckyjet.html" class="game-card" style="--accent:#00d4aa" onclick="quickNav('luckyjet')">
                <span class="game-badge badge-live">LIVE</span>
                <div class="game-icon">🚀</div>
                <div class="game-name">Lucky Jet</div>
                <div class="game-provider">1win Games</div>
            </a>
            <a href="games/astronaut.html" class="game-card" style="--accent:#5b7fff" onclick="quickNav('astronaut')">
                <span class="game-badge badge-live">LIVE</span>
                <div class="game-icon">👨‍🚀</div>
                <div class="game-name">Astronaut</div>
                <div class="game-provider">100HP Gaming</div>
            </a>
            <a href="games/rocketqueen.html" class="game-card" style="--accent:#ff6b9d" onclick="quickNav('rocketqueen')">
                <div class="game-icon">👑</div>
                <div class="game-name">Rocket Queen</div>
                <div class="game-provider">1win Games</div>
            </a>
            <a href="games/crash.html" class="game-card" style="--accent:#ffd700" onclick="quickNav('crash')">
                <div class="game-icon">💥</div>
                <div class="game-name">Crash</div>
                <div class="game-provider">1win Games</div>
            </a>
            <a href="games/metacrash.html" class="game-card" style="--accent:#9b59b6" onclick="quickNav('metacrash')">
                <span class="game-badge badge-new">NEW</span>
                <div class="game-icon">⚡</div>
                <div class="game-name">Speed & Cash</div>
                <div class="game-provider">1win Games</div>
            </a>
            <a href="games/rocketx.html" class="game-card" style="--accent:#e74c3c" onclick="quickNav('rocketx')">
                <div class="game-icon">🚀</div>
                <div class="game-name">Space XY</div>
                <div class="game-provider">BGaming</div>
            </a>
            <a href="games/tropicana.html" class="game-card" style="--accent:#1abc9c" onclick="quickNav('tropicana')">
                <div class="game-icon">🌴</div>
                <div class="game-name">Tropicana</div>
                <div class="game-provider">100HP Gaming</div>
            </a>
            <a href="games/aviator.html" class="game-card" style="--accent:#e67e22" onclick="quickNav('aviator')">
                <span class="game-badge badge-live">LIVE</span>
                <div class="game-icon">✈️</div>
                <div class="game-name">Aviator</div>
                <div class="game-provider">Spribe</div>
            </a>
            <a href="games/aviatrix.html" class="game-card" style="--accent:#3498db" onclick="quickNav('aviatrix')">
                <div class="game-icon">🎮</div>
                <div class="game-name">Aviatrix</div>
                <div class="game-provider">Aviatrix</div>
            </a>
            <a href="games/fortune.html" class="game-card" style="--accent:#f39c12" onclick="quickNav('fortune')">
                <span class="game-badge badge-new">NEW</span>
                <div class="game-icon">🐯</div>
                <div class="game-name">Fortune Tiger</div>
                <div class="game-provider">100HP Gaming</div>
            </a>
        </div>
    </div>

    <div class="footer">
        <p>GOD OF CASINO &copy; 2025</p>
        <a href="https://t.me/GOD_CASINO54" class="tg-btn" target="_blank">
            <i class="fab fa-telegram"></i> Support Telegram
        </a>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script>
        // Telegram WebApp
        if (window.Telegram && window.Telegram.WebApp) {
            Telegram.WebApp.ready();
            Telegram.WebApp.expand();
        }

        // Quick prediction sur la page d'accueil
        function generateQuickPrediction() {
            const games = ['Lucky Jet', 'Astronaut', 'Rocket Queen', 'Crash', 'Aviator'];
            const game = games[Math.floor(Math.random() * games.length)];
            const avg = 2.5 + Math.random() * 2;
            const lambda = 1.0 / avg;
            const u = Math.random() * 0.999;
            let coeff = -Math.log(1 - u) / lambda;
            coeff = Math.max(1.10, Math.min(50, coeff));
            coeff = parseFloat(coeff.toFixed(2));
            
            document.getElementById('quickCoeff').textContent = 'x' + coeff;
            document.getElementById('quickGame').textContent = game;
        }
        
        generateQuickPrediction();
        setInterval(generateQuickPrediction, 8000);
        
        function quickNav(game) {
            // Animation de transition
        }
    </script>
</body>
</html>
