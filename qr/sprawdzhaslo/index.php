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

        // Sprawdzanie, czy formularz został wysłany
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            // Pobieramy zadanie i hasło
            $task = $_POST['task'];
            $password = strtolower($_POST['password']); // Wersja z małymi literami

            // Porównanie hasła
            if ($password === strtolower($passwords[$task])) {
                $message = "Poprawne hasło do zadania!";
                $messageClass = 'correct';
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
    </div>

    <footer>
        <div class="footer-bottom">
            <p>&copy; <?php echo date("Y"); ?> Juliusz Sagan. Wszystkie prawa zastrzeżone.</p>
        </div>
    </footer>

</body>
</html>
