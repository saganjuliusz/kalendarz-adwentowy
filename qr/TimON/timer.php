<?php
header('Content-Type: application/json');
header('Cache-Control: no-cache, must-revalidate');

$dataFile = 'timer_data.json';

function readData() {
    global $dataFile;
    if (file_exists($dataFile)) {
        return json_decode(file_get_contents($dataFile), true);
    }
    return [
        'tabs' => [
            [
                'id' => 'tab1',
                'name' => 'Timer 1',
                'isRunning' => false,
                'startTime' => 0,
                'elapsedTime' => 0,
                'splits' => []
            ]
        ],
        'activeTab' => 'tab1'
    ];
}

function writeData($data) {
    global $dataFile;
    file_put_contents($dataFile, json_encode($data));
}

function findTabIndex($data, $tabId) {
    foreach ($data['tabs'] as $index => $tab) {
        if ($tab['id'] === $tabId) {
            return $index;
        }
    }
    return -1;
}

$data = readData();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (isset($input['action'])) {
        $activeTabId = isset($input['tabId']) ? $input['tabId'] : $data['activeTab'];
        $tabIndex = findTabIndex($data, $activeTabId);
        
        if ($tabIndex === -1 && $input['action'] !== 'addTab' && $input['action'] !== 'switchTab') {
            echo json_encode(['error' => 'Tab not found']);
            exit;
        }

        switch ($input['action']) {
            case 'start':
                $data['tabs'][$tabIndex]['isRunning'] = true;
                $data['tabs'][$tabIndex]['startTime'] = microtime(true) * 1000;
                break;
            case 'stop':
                $data['tabs'][$tabIndex]['isRunning'] = false;
                $data['tabs'][$tabIndex]['elapsedTime'] += (microtime(true) * 1000) - $data['tabs'][$tabIndex]['startTime'];
                $data['tabs'][$tabIndex]['startTime'] = 0;
                break;
            case 'reset':
                $data['tabs'][$tabIndex]['isRunning'] = false;
                $data['tabs'][$tabIndex]['startTime'] = 0;
                $data['tabs'][$tabIndex]['elapsedTime'] = 0;
                $data['tabs'][$tabIndex]['splits'] = [];
                break;
            case 'split':
                $currentTime = $data['tabs'][$tabIndex]['isRunning'] 
                    ? $data['tabs'][$tabIndex]['elapsedTime'] + (microtime(true) * 1000) - $data['tabs'][$tabIndex]['startTime']
                    : $data['tabs'][$tabIndex]['elapsedTime'];
                $data['tabs'][$tabIndex]['splits'][] = [
                    'count' => count($data['tabs'][$tabIndex]['splits']) + 1,
                    'time' => $currentTime,
                    'name' => ''
                ];
                break;
            case 'editSplitName':
                if (isset($input['index']) && isset($input['newName'])) {
                    $data['tabs'][$tabIndex]['splits'][$input['index']]['name'] = $input['newName'];
                }
                break;
            case 'switchTab':
                if (isset($input['tabId'])) {
                    $data['activeTab'] = $input['tabId'];
                }
                break;
            case 'addTab':
                $newTabId = 'tab' . (count($data['tabs']) + 1);
                $newTabName = isset($input['name']) ? $input['name'] : 'Timer ' . (count($data['tabs']) + 1);
                $data['tabs'][] = [
                    'id' => $newTabId,
                    'name' => $newTabName,
                    'isRunning' => false,
                    'startTime' => 0,
                    'elapsedTime' => 0,
                    'splits' => []
                ];
                $data['activeTab'] = $newTabId;
                break;
            case 'removeTab':
                if (count($data['tabs']) > 1) {
                    array_splice($data['tabs'], $tabIndex, 1);
                    if ($data['activeTab'] === $activeTabId) {
                        $data['activeTab'] = $data['tabs'][0]['id'];
                    }
                }
                break;
            case 'renameTab':
                if (isset($input['newName'])) {
                    $data['tabs'][$tabIndex]['name'] = $input['newName'];
                }
                break;
        }
        writeData($data);
    }
}

echo json_encode($data);
?>