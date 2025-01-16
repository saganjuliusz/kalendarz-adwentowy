<?php
session_start();
require_once 'api/config.php';
date_default_timezone_set('Europe/Warsaw');

$currentDay = intval(date('d'));
$currentMonth = intval(date('m'));

// Pobierz niespodziankę na dzisiejszy dzień
$stmt = $pdo->prepare("SELECT * FROM surprises WHERE id = ?");
$stmt->execute([$currentDay]);
$surprise = $stmt->fetch();

$data = array(
    'description' => $surprise['description'],
    'emoji' => $surprise['emoji'],
    'evaluation' => $surprise['evaluation'],
    'implementation' => $surprise['implementation'],
    'rules' => $surprise['rules'],
    'title' => $surprise['title']
);

// Sprawdź czy drzwiczki są już otwarte
$sessionId = session_id();
$stmt = $pdo->prepare("SELECT * FROM opened_doors WHERE user_session_id = ? AND door_number = ?");
$stmt->execute([$sessionId, $currentDay]);
$isOpened = $stmt->fetch() !== false;
?>

<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TEBowski Kalendarz Adwentowy</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        :root {
            --primary-color: #1e3d59;
            --secondary-color: #ff6e40;
            --accent-color: #ffc13b;
            --background-color: #f5f0e1;
            --door-closed: linear-gradient(135deg, #1e3d59, #17314a);
            --door-open: linear-gradient(135deg, #ff6e40, #ff5722);
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes scaleIn {
            from { transform: scale(0); }
            to { transform: scale(1); }
        }

        @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
        }

        @keyframes snowfall {
            0% { transform: translateY(-100vh) rotate(0deg); }
            100% { transform: translateY(100vh) rotate(360deg); }
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: var(--background-color);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            background-image: 
                radial-gradient(circle at 25px 25px, rgba(255,255,255,0.2) 2%, transparent 2%),
                radial-gradient(circle at 75px 75px, rgba(255,255,255,0.2) 2%, transparent 2%);
            background-size: 100px 100px;
        }

        h1 {
            color: var(--primary-color);
            font-size: 3em;
            text-align: center;
            margin-bottom: 40px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
            animation: float 3s ease-in-out infinite;
        }

        .snow {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
        }

        .container {
            background: white;
            padding: 30px;
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            max-width: 600px;
            width: 95%;
            margin: 0 auto;
            text-align: center;
            position: relative;
            z-index: 2;
        }

        .door {
            aspect-ratio: 1;
            background: var(--door-closed);
            border-radius: 15px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-size: 2em;
            color: white;
            cursor: pointer;
            position: relative;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 8px 25px rgba(0,0,0,0.2);
            overflow: hidden;
            max-width: 300px;
            margin: 0 auto;
            margin-bottom: 20px;
        }

        .door.opened {
            background: var(--door-open);
            transform: scale(0.98);
        }

        .door-number {
            font-size: 2.5em;
            font-weight: bold;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .door-icon {
            font-size: 1.2em;
            margin-top: 10px;
            opacity: 0.8;
        }

        .surprise-content {
            display: none;
            animation: fadeIn 0.5s ease;
            margin-top: 20px;
            text-align: left;
        }

        .surprise-section {
            background-color: var(--background-color);
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 15px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        .surprise-description {
            font-size: 1.2em;
            color: var(--primary-color);
            line-height: 1.6;
        }

        .surprise-evaluation, 
        .surprise-implementation, 
        .surprise-rules {
            font-size: 1em;
            color: #666;
            margin-top: 15px;
        }

        .surprise-evaluation::before {
            content: "📏 Oceniamy: ";
            font-weight: bold;
            color: var(--secondary-color);
        }

        .surprise-implementation::before {
            content: "⏰ Termin: ";
            font-weight: bold;
            color: var(--secondary-color);
        }

        .surprise-rules::before {
            content: "🔧 Zasady: ";
            font-weight: bold;
            color: var(--secondary-color);
        }

        .surprise-content.visible {
            display: block;
        }

        .surprise-title {
            font-size: 2em;
            color: var(--primary-color);
            margin-bottom: 20px;
        }

        .surprise-description {
            font-size: 1.2em;
            color: #666;
            line-height: 1.6;
            margin-bottom: 30px;
        }

        .date-info {
            background: var(--primary-color);
            color: white;
            padding: 10px 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            display: inline-block;
        }

        @media (max-width: 768px) {
            h1 {
                font-size: 2em;
            }
            
            .container {
                padding: 20px;
            }
            
            .door {
                font-size: 1.5em;
            }
        }
    </style>
</head>
<body>
    <div class="snow"></div>
    <h1>🎄 TEBowski Kalendarz Adwentowy 🎄</h1>

    <?php if ($currentMonth == 12 && $currentDay <= 24): ?>
        <div class="container">
            <div class="date-info">
                Dzień <?php echo $currentDay; ?> grudnia
            </div>

            <?php if ($surprise): ?>
                <div class="door <?php echo $isOpened ? 'opened' : ''; ?>" onclick="openDoor()">
                    <div class="door-number"><?php echo $currentDay; ?></div>
                    <div class="door-icon"><?php echo $data['emoji']; ?></div>
                </div>

                <div class="surprise-content <?php echo $isOpened ? 'visible' : ''; ?>" id="surpriseContent">
                    <div class="surprise-section surprise-title"><?php echo $data['title']; ?></div>
                    <div class="surprise-section surprise-description"><?php echo $data['description']; ?></div>
                    <div class="surprise-section surprise-evaluation"><?php echo $data['evaluation']; ?></div>
                    <div class="surprise-section surprise-implementation"><?php echo $data['implementation']; ?></div>
                    <div class="surprise-section surprise-rules"><?php echo $data['rules']; ?></div>
            <?php else: ?>
                <p>Brak zadań na dziś. Spróbuj następnego dnia.</p>
            <?php endif; ?>
        </div>
    <?php else: ?>
        <div class="container">
            <p>Kalendarz adwentowy jest dostępny tylko w grudniu!</p>
        </div>
    <?php endif; ?>

    <script>
        // Efekt śniegu
        function createSnowflakes() {
            const snow = document.querySelector('.snow');
            const numberOfSnowflakes = 50;

            for(let i = 0; i < numberOfSnowflakes; i++) {
                createSnowflake(snow);
            }
        }

        function createSnowflake(container) {
            const snowflake = document.createElement('div');
            snowflake.style.position = 'fixed';
            snowflake.style.background = 'white';
            snowflake.style.borderRadius = '50%';
            
            const size = Math.random() * 5 + 2;
            const startPosition = Math.random() * window.innerWidth;
            const delay = Math.random() * 5;
            const duration = Math.random() * 3 + 2;
            const opacity = Math.random() * 0.6 + 0.4;

            snowflake.style.width = `${size}px`;
            snowflake.style.height = `${size}px`;
            snowflake.style.left = `${startPosition}px`;
            snowflake.style.opacity = opacity;
            snowflake.style.animation = `snowfall ${duration}s linear infinite`;
            snowflake.style.animationDelay = `${delay}s`;

            container.appendChild(snowflake);

            snowflake.addEventListener('animationend', () => {
                snowflake.remove();
                createSnowflake(container);
            });
        }

        function openDoor() {
            const door = document.querySelector('.door');
            const surpriseContent = document.getElementById('surpriseContent');
            
            if (!door.classList.contains('opened')) {
                door.classList.add('opened');
                surpriseContent.classList.add('visible');
                
                // Efekt konfetti
                createConfetti();
            }
        }

        function createConfetti() {
            const colors = ['#ff6e40', '#ffc13b', '#1e3d59', '#f5f0e1'];
            const confettiCount = 100;

            for (let i = 0; i < confettiCount; i++) {
                const confetti = document.createElement('div');
                confetti.style.position = 'fixed';
                confetti.style.width = '10px';
                confetti.style.height = '10px';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.left = Math.random() * window.innerWidth + 'px';
                confetti.style.top = '-10px';
                confetti.style.zIndex = '1000';
                confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
                confetti.style.opacity = Math.random();

                document.body.appendChild(confetti);

                const animation = confetti.animate([
                    { transform: `translate(0, 0) rotate(0deg)`, opacity: 1 },
                    { transform: `translate(${Math.random() * 300 - 150}px, ${window.innerHeight}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }
                ], {
                    duration: Math.random() * 2000 + 1000,
                    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                });

                animation.onfinish = () => confetti.remove();
            }
        }

        // Inicjalizacja
        createSnowflakes();
        window.addEventListener('resize', () => {
            document.querySelector('.snow').innerHTML = '';
            createSnowflakes();
        });
    </script>
    <footer>
        <div class="footer-bottom">
            <p>&copy; <?php echo date("Y"); ?> Juliusz Sagan. Wszystkie prawa zastrzeżone.</p>
        </div>
    </footer>

</body>
</html>