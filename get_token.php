<?php
/**
 * Token Fetcher - Recupere les tokens b frais depuis 1win.ci (demo mode)
 * Permet de garder les iframes a jour automatiquement
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$game = isset($_GET['game']) ? strtolower(trim($_GET['game'])) : '';

if (empty($game)) {
    echo json_encode(['error' => 'Param game requis']);
    exit;
}

// Mapping jeux vers URLs 1win.ci demo
$GAME_MAP = [
    'luckyjet' => 'https://1win.ci/casino/play/v_1wingames:luckyjet',
    'rocketqueen' => 'https://1win.ci/casino/play/v_1wingames:rocketqueen',
    'crash' => 'https://1win.ci/casino/play/v_1wingames:crash',
    'rocketx' => 'https://1win.ci/casino/play/v_bgaming:spacexy',
    'metacrash' => 'https://1win.ci/casino/play/v_1wingames:speedncash',
    'astronaut' => 'https://1win.ci/casino/play/v_100hp:astronaut',
    'tropicana' => 'https://1win.ci/casino/play/v_100hp:tropicana',
    'fortune' => 'https://1win.ci/casino/play/v_100hp:tropicana',
    'aviator' => 'https://1win.ci/casino/play/v_spribe:aviator',
    'aviatrix' => 'https://1win.ci/casino/play/aviatrix_nft-aviatrix',
];

if (!isset($GAME_MAP[$game])) {
    echo json_encode(['error' => 'Jeu non reconnu: ' . $game]);
    exit;
}

// Cache directory
$cacheDir = __DIR__ . '/cache';
if (!is_dir($cacheDir)) {
    @mkdir($cacheDir, 0755, true);
}

$cacheFile = $cacheDir . '/token_' . $game . '.json';
$cacheTime = 1800; // 30 minutes

// Verifier le cache
if (file_exists($cacheFile)) {
    $cached = json_decode(file_get_contents($cacheFile), true);
    if ($cached && isset($cached['timestamp']) && (time() - $cached['timestamp']) < $cacheTime) {
        echo json_encode($cached);
        exit;
    }
}

// URLs iframe connues (fallback si le scraping echoue)
$KNOWN_IFRAMES = [
    'luckyjet' => [
        'base' => 'https://1play.gamedev-tech.cc/lucky_grm/vgs/',
        'pattern' => '1win'
    ],
    'rocketqueen' => [
        'base' => 'https://1play.gamedev-tech.cc/queen_grm/vgs/',
        'pattern' => '1win'
    ],
    'crash' => [
        'base' => 'https://1play.gamedev-tech.cc/crash_grm/vgs-1play/',
        'pattern' => '1win'
    ],
    'astronaut' => [
        'base' => 'https://100hp.app/astronaut_grm/vgs/',
        'pattern' => '100hp'
    ],
    'tropicana' => [
        'base' => 'https://100hp.app/tropicana_grm/vgs/',
        'pattern' => '100hp'
    ],
    'aviator' => [
        'base' => 'https://demo.spribe.io/launch/aviator',
        'pattern' => 'spribe'
    ],
    'aviatrix' => [
        'base' => 'https://game-tr.airframe-gptnux.online/',
        'pattern' => 'aviatrix'
    ],
];

// Essayer de recuperer le token depuis 1win.ci
$token = null;
$iframeSrc = null;

// Tentative avec cURL
$url = $GAME_MAP[$game];

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT => 15,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => false,
    CURLOPT_USERAGENT => 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    CURLOPT_HTTPHEADER => [
        'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language: en-US,en;q=0.9,fr;q=0.8',
        'Referer: https://1win.ci/',
    ],
]);

$html = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($html && $httpCode === 200) {
    // Extraire les URLs d'iframe depuis le HTML
    // Pattern 1: iframe src avec b= parameter
    if (preg_match('/src="(https?:\/\/[^"]*\?b=[^"]*)"/i', $html, $matches)) {
        $iframeSrc = $matches[1];
    }
    // Pattern 2: data-src
    elseif (preg_match('/data-src="(https?:\/\/[^"]*)"/i', $html, $matches)) {
        $iframeSrc = $matches[1];
    }
    // Pattern 3: JSON embedded
    elseif (preg_match('/(https?:\/\/[^\s"\'<>]+\?b=[^\s"\'<>]+)/i', $html, $matches)) {
        $iframeSrc = $matches[1];
    }
    
    // Extraire le parametre b
    if ($iframeSrc && preg_match('/[?&]b=([a-f0-9.]+)/i', $iframeSrc, $bMatch)) {
        $token = $bMatch[1];
    }
}

// Si on a pas pu scraper, utiliser le dernier token cache ou un fallback
if (empty($token)) {
    // Lire le dernier cache meme expire
    if (file_exists($cacheFile)) {
        $oldCache = json_decode(file_get_contents($cacheFile), true);
        if ($oldCache && !empty($oldCache['b_token'])) {
            $token = $oldCache['b_token'];
            $iframeSrc = $oldCache['iframe_src'];
        }
    }
}

// Construire l'iframe src si on a le token
if (!empty($token) && isset($KNOWN_IFRAMES[$game])) {
    $known = $KNOWN_IFRAMES[$game];
    if (strpos($known['base'], 'spribe') !== false) {
        // Spribe: different format
        $iframeSrc = $known['base'] . '?currency=USD&lang=en&return_url=https%3A%2F%2F1win.ci%2Fcasino';
    } elseif (strpos($known['base'], 'airframe') !== false) {
        // Aviatrix: different format
        $iframeSrc = $known['base'] . '?cid=1win&isDemo=true&lang=en&lobbyUrl=https%3A%2F%2F1win.ci%252Fcasino&m=1&productId=nft-aviatrix';
    } else {
        $iframeSrc = $known['base'] . '?b=' . $token . '&language=en&pid=1win';
    }
}

$result = [
    'game' => $game,
    'b_token' => $token,
    'iframe_src' => $iframeSrc,
    'token_fresh' => !empty($token) && $token !== (isset($oldCache['b_token']) ? $oldCache['b_token'] : ''),
    'timestamp' => time(),
    'cache_until' => time() + $cacheTime,
];

// Sauver en cache
@file_put_contents($cacheFile, json_encode($result));

echo json_encode($result);
