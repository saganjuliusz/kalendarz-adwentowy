<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sprawdź hasło</title>
    <link rel="stylesheet" href="../css/styles.css">
</head>
<body>
    <div class="container">
        <h1>Sprawdź hasło</h1>
        <?php
        // Wczytanie pliku z hasłami
        include('pass.php');
        // Zmienna do przechowywania komunikatu
        $message = '';
        $messageClass = '';
        // NOWA FUNKCJONALNOŚĆ: Zmienna do kontrolowania odtwarzania muzyki
        $playMusic = false;
        // Sprawdzanie, czy formularz został wysłany
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            // Pobieramy zadanie i hasło
            $task = $_POST['task'];
            $password = strtolower($_POST['password']); // Wersja z małymi literami
            // Porównanie hasła
            if ($password === strtolower($passwords[$task])) {
                $message = "Poprawne hasło do zadania!";
                $messageClass = 'correct';
                
                // NOWA FUNKCJONALNOŚĆ: Sprawdzenie czy to główne hasło (zadanie 8)
                if ($task === '8') {
                    $playMusic = true;
                    $message = "Gratulacje! Główne hasło jest poprawne!";
                }
            } else {
                $message = 'Niepoprawne hasło.';
                $messageClass = 'incorrect';
            }
        }
        ?>
        <form method="POST" action="">
            <label for="task">Wybierz zadanie:</label>
            <select id="task" name="task">
                <option value="1">Zadanie 1</option>
                <option value="2">Zadanie 2</option>
                <option value="3">Zadanie 3</option>
                <option value="4">Zadanie 4</option>
                <option value="5">Zadanie 5</option>
                <option value="6">Zadanie 6</option>
                <option value="7">Zadanie 7</option>
                <option value="8">Główne hasło</option>
            </select>
            
            <br>
            <label for="password">Hasło:</label>
            <input type="text" id="password" name="password" value="">
            
            <br><br>
            <button type="submit">Sprawdź hasło</button>
        </form>
        <?php if ($message !== ''): ?>
            <p class="<?php echo $messageClass; ?>"><?php echo $message; ?></p>
        <?php endif; ?>

        <!-- NOWA FUNKCJONALNOŚĆ: Element audio do odtwarzania muzyki -->
        <?php if ($playMusic): ?>
            <audio id="surpriseMusic" loop>
                <source src="niespodzianka2.mp3" type="audio/mpeg">
                Twoja przeglądarka nie obsługuje elementu audio.
            </audio>
            
            <!-- NOWA FUNKCJONALNOŚĆ: Przycisk do zatrzymania muzyki -->
            <div style="margin-top: 20px; text-align: center;">
                <button onclick="toggleMusic()" id="musicButton">Zatrzymaj muzykę</button>
            </div>

            <!-- NOWA FUNKCJONALNOŚĆ: Automatyczne uruchomienie muzyki po załadowaniu strony -->
            <script>
                document.addEventListener('DOMContentLoaded', function() {
                    const audio = document.getElementById('surpriseMusic');
                    audio.play().catch(function(error) {
                        console.log('Automatyczne odtwarzanie zostało zablokowane przez przeglądarkę');
                    });
                });
            </script>
        <?php endif; ?>
    </div>
    <footer>
        <div class="footer-bottom">
            <p>&copy; <?php echo date("Y"); ?> Juliusz Sagan. Wszystkie prawa zastrzeżone.</p>
        </div>
    </footer>

    <!-- NOWA FUNKCJONALNOŚĆ: JavaScript do kontroli muzyki -->
    <script>
        function toggleMusic() {
            const audio = document.getElementById('surpriseMusic');
            const button = document.getElementById('musicButton');
            
            if (audio.paused) {
                audio.play();
                button.textContent = 'Zatrzymaj muzykę';
            } else {
                audio.pause();
                button.textContent = 'Odtwórz muzykę';
            }
        }
    </script>
</body>
</html>