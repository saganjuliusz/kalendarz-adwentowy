<!--Copyright by Juliusz Sagan. The right to copy is strictly prohibited! It is forbidden to use resources inappropriately!-->
<?php header('Content-type: text/html; charset=UTF-8'); ?>

<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TimON</title>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="container">
        <div class="app-header">
            <h1 class="app-title">TimON <span class="version"></span></h1>
        </div>
        
        <div class="tabs-wrapper">
            <div id="tabs-container"></div>
            <button id="add-tab" class="add-tab-btn" title="Dodaj nowy timer"><i class="fas fa-plus"></i></button>
        </div>
        
        <div class="timer-display-wrapper">
            <div id="display">00:00:00.00</div>
        </div>
        
        <div class="button-container">
            <button id="startStop"><i class="fas fa-play"></i> Start</button>
            <button id="split"><i class="fas fa-flag"></i> Międzyczas</button>
            <button id="reset"><i class="fas fa-redo-alt"></i> Reset</button>
        </div>
        
        <div class="split-times-container">
            <h3 class="split-header"><i class="fas fa-clipboard-list"></i> Zapisane czasy</h3>
            <div id="splitTimes"></div>
        </div>
    </div>
    
    <footer>
        <div class="footer-bottom">
            <p>&copy; <?php echo date("Y"); ?> Juliusz Sagan. Wszystkie prawa zastrzeżone.</p>
        </div>
    </footer>

    <script src="js/timer.js"></script>
</body>
</html>
<!--Copyright by Juliusz Sagan. The right to copy is strictly prohibited! It is forbidden to use resources inappropriately!-->