var crypto = require('crypto');
const Rows: number = 15, Columns: number = 15;  // Размер поля
let Table_hash: number[][][] = []; // Таблица для хранения хэша где [номер строки][номер столбца][-1 если для игрока, 1 если для ИИ]
Table_init(); // Инициализация Table_hash
const IS_WIN: boolean = false; // Флаг победного хода
const Cache = new Map(); // Кэш
const State_Cache = new Map(); // Состояние кэша
const MaximumDepth = 4; // Максимальная глубина на которую будет вестись поиск

/* Указаны стоимости блоков ячеек. Они бывают открытые и полуоткрытые.
 * откртыте состояния это когда нет соседей противников, например открытая тройка _ооо_
 * полуоткрытое состояние когда есть с одной стороны сосед, например полуоткрытая тройка хооо_
 открытые состояния ценятся больше*/
const OpenOne: number = 10;
const CloseOne: number = 1;
const OpenTwo: number = 100;
const CloseTwo: number = 10;
const OpenThree: number = 1000;
const CloseThree: number = 100;
const OpenFour: number = 10000;
const CloseFour: number = 1000;
const Five: number = 100000;

//Проверяем, вляется ли линия победной (5 подряд идущих значений)
function check_directions(line: number[]) {
    for (let i: number = 0; i < line.length - 4; i++) {
        if (line[i] !== 0) {
            if (line[i] === line[i + 1] && line[i] === line[i + 2] && line[i] === line[i + 3] && line[i] === line[i + 4]) {
                return true
            }
        }
    }
    return false;
}

//Возвращаем массив всех возможных линий из точки x, y
function get_lines(board: number[][], x: number, y: number) {
    const lines: number[][] = [[], [], [], []];
    for (let i: number = -4; i < 5; i++) {
        if (x + i >= 0 && x + i <= Rows - 1) {
            lines[0].push(board[x + i][y]) // вертикаль
            if (y + i >= 0 && y + i <= Columns - 1) {
                lines[2].push(board[x + i][y + i]) // диагональ
            }
        }
        if (y + i >= 0 && y + i <= Columns - 1) {
            lines[1].push(board[x][y + i]) // горизонталь
            if (x - i >= 0 && x - i <= Rows - 1) {
                lines[3].push(board[x - i][y + i]) // анти-диагональ
            }
        }
    }
    return lines
}

//Проверка победы после этого хода, из точки x, y
function check_win(board: number[][], x: number, y: number) {
    const lines: number[][] = get_lines(board, x, y)
    for (let i = 0; i < 4; i++) {
        if (check_directions(lines[i])) {
            return true
        }
    }
    return false;
}

/*Создание границ в которых мы будем осуществлять поиск
 Это прямоугольник внутри которого находятся все закрашенные клетки*/
function create_limits(board: number[][]) {
    let min_x: number = Rows;
    let min_y: number = Columns;
    let max_x: number = -1;
    let max_y: number = -1;
    for (let i = 0; i < Rows; i++) {
        for (let j = 0; j < Columns; j++) {
            if (board[i][j] !== 0) {
                min_x = Math.min(min_x, i)
                min_y = Math.min(min_y, j)
                max_x = Math.max(max_x, i)
                max_y = Math.max(max_y, j)
            }
        }
    }
    // В дальнейшем в качестве перспективных клеток рассматриваются клетки внутри и в радиусе 2 клеток
    // Поэтому если граница выходит за прямоугольник [[2, 2], [2, Columns - 3], [Rows - 3, Colums - 3], [Rows - 3, 2]] ее обрезаем
    min_x = Math.max(min_x, 2)
    min_y = Math.max(min_y, 2)
    max_x = Math.min(max_x, Rows - 3)
    max_y = Math.min(max_y, Columns - 3)
    return [min_x, min_y, max_x, max_y]
}

// Изменение границ в которых мы будем осуществлять поиск
function change_limits(limits: number[], i:number, j:number) {
    let min_x: number = limits[0];
    let min_y: number = limits[1];
    let max_x: number = limits[2];
    let max_y: number = limits[3];
    if (i < min_x) {
        min_x = Math.max(i, 2)
    } else if (i > max_x) {
        max_x = Math.min(i, Rows - 3)
    }
    if (j < min_y) {
        min_y = Math.max(j, 2)
    } else if (j > max_y) {
        max_y = Math.min(j, Columns - 3)
    }
    return [min_x, min_y, max_x, max_y]
}

//Генерация 32-битного беззнакового целого числа
function random32() {
    let o = new Uint32Array(1);
    crypto.getRandomValues(o);
    return o[0];
}

//Хэширование Зобриста
function Table_init() {
    for (let i: number = 0; i < Rows; i++) {
        Table_hash[i] = [];
        for (let j: number = 0; j < Columns; j++) {
            Table_hash[i][j] = []
            Table_hash[i][j][0] = random32(); // 32-битное случайное число
            Table_hash[i][j][1] = random32();
        }
    }
}

//Хеширование всей доски
function hash(board: number[][]) {
    let h: number = 0;
    let p: number;
    for (let i = 0; i < Rows; i++) {
        for (let j = 0; j < Columns; j++) {
            const board_value = board[i][j];
            if (board_value !== 0) { //игнорируем пустые клетки
                if (board_value === -1) {
                    p = 0  //игрок 0 - противник
                } else {
                    p = 1 //игрок 1 - свои
                }
                h = h ^ Table_hash[i][j][p];
            }
        }
    }
    return h;
}

//Обновление хэша
function update_hash(hash: number, player, x: number, y: number) { //Обновляем хэш
    if (player === -1) {
        player = 0
    } else {
        player = 1
    }
    hash = hash ^ Table_hash[x][y][player];
    return hash
}

// Проверяет, является ли клетка удаленной, если в радиусе 2 клеток у клетки нет соседей, то она не перспективная
function is_remote_cell(board: number[][], x: number, y: number) {
    for (let i: number = x - 2; i <= y + 2; i++) {
        if (i < 0 || i >= Rows)
            continue;
        for (let j: number = x - 2; j <= y + 2; j++) {
            if (j < 0 || j >= Columns)
                continue;
            if (board[i][j] !== 0)
                return false;
        }
    }
    return true;
}

//В зависимости от параметра seq направлению дается приоритет
function evalff(seq: number) {
    switch (seq) {
        case 0:
            return 7;
        // Важно заполнить свое перспектиное напрвление
        case 1:
            return 35;
        case 2:
            return 800;
        case 3:
            return 15000;
        case 4:
            return 800000;
        // Закрыть перспективное направление для соперника, чуть менее важно
        case -1:
            return 15;
        case -2:
            return 400;
        case -3:
            return 1800;
        case -4:
            return 100000;
        // Самое бесперспективное, направление в котором есть и свои и чужие
        case 17:
            return 0; 
    }
}

//Расчет коэфицента по которому высчитывается перспективность данной линии в зависимости от того, сколько своих и вражеских клеток на линии
function get_seq(y: number, e: number) {
    if (y + e === 0) {
        return 0;
    }
    if (y !== 0 && e === 0) {
        return y // Есть только твои, значит для тебя перспетивное
    }
    if (y === 0 && e !== 0) {
        return -e // Есть только чужие, значит перспективно для противника
    }
    if (y !== 0 && e !== 0) {
        return 17
    }
}

//Оценка выгодности направления
function evaluate_lines(direction_arr: number[], player: number) {
    let score: number = 0; // во сколько очков оценивается направление
    for (let i = 0; (i + 4) < direction_arr.length; i++) {
        let you: number = 0; // твои клетки на направлении
        let enemy: number = 0; // чужие клетки на направлении
        for (let j = 0; j <= 4; j++) {
            if (direction_arr[i + j] === player) {
                you++
            } else if (direction_arr[i + j] === -player) {
                enemy++
            }
        }
        score += evalff(get_seq(you, enemy));
        if ((score >= 800000)) {
            return IS_WIN; // Победный ход
        }
    }
    return score
}

//Оценка выгодности хода в точку x, y
function evaluate_move(board, x, y, player) {
    let score: number = 0; // Сумма очков на всех направлениях
    const lines: number[][] = get_lines(board, x, y);
    let temp_score;
    for (let i = 0; i < 4; i++) {
        temp_score = evaluate_lines(lines[i], player);
        if (temp_score === IS_WIN) { //если данный ход выигрывает игру, сразу же возвращаем его
            return IS_WIN
        } else {
            score += temp_score
        }
    }
    return score;
}

//Оценка состояния данного построения клеток
function evaluateblock(blocks: number, pieces: number) {
    // Если нет вражеской клетки в построении
    if (blocks === 0) {
        switch (pieces) {
            case 1:
                return OpenOne;
            case 2:
                return OpenTwo;
            case 3:
                return OpenThree;
            case 4:
                return OpenFour;
            default:
                return Five;
        }
    } else if (blocks === 1) {
        switch (pieces) {
            case 1:
                return CloseOne;
            case 2:
                return CloseTwo;
            case 3:
                return CloseThree;
            case 4:
                return CloseFour;
            default:
                return Five;
        }
    } else {
        if (pieces >= 5) {
            return Five;
        } else {
            return 0
        }
    }
}

// Оценка состояния доски с точки зрения игрока
function eval_board(board: number[][], pieceType, limits: number[]) {
    let score: number = 0;
    const min_x: number = limits[0];
    const min_y: number = limits[1];
    const max_x: number = limits[2];
    const max_y: number = limits[3];
    // По горизонтали
    for (let row: number = min_x; row < max_x + 1; row++) {
        for (let column: number = min_y; column < max_y + 1; column++) {
            if (board[row][column] == pieceType) {
                let block = 0;
                let piece = 1;
                // Слева от начала ряда
                if (column === 0 || board[row][column - 1] !== 0) {
                    block++;
                }
                // Длинна ряда подряд идущих клеток
                for (column++; column < Columns && board[row][column] === pieceType; column++) {
                    piece++;
                }
                // Справа от конца ряда
                if (column === Columns || board[row][column] !== 0) {
                    block++;
                }
                score += evaluateblock(block, piece);
            }
        }
    }
    // По вертикали
    for (let column = min_y; column < max_y + 1; column++) {
        for (let row = min_x; row < max_x + 1; row++) {
            if (board[row][column] == pieceType) {
                let block = 0;
                let piece = 1;
                // Сверху от начала колонны
                if (row === 0 || board[row - 1][column] !== 0) {
                    block++;
                }
                // Длинна колонны подряд идущих клеток
                for (row++; row < Rows && board[row][column] === pieceType; row++) {
                    piece++;
                }
                // Снизу от конца колонны
                if (row === Rows || board[row][column] !== 0) {
                    block++;
                }
                score += evaluateblock(block, piece);
            }
        }
    }
    // Антидиагональ
    for (let n = min_x; n < (max_y - min_y + max_x); n++) {
        let r = n;
        let c = min_y;
        while (r >= min_x && c <= max_y) {
            if (r <= max_x) {
                if (board[r][c] === pieceType) {
                    let block = 0;
                    let piece = 1;
                    // Слева внизу от начала
                    if (c === 0 || r === Rows - 1 || board[r + 1][c - 1] !== 0) {
                        block++;
                    }
                    // Длинна диагонали подряд идущих клеток
                    r--;
                    c++;
                    for (; r >= 0 && board[r][c] === pieceType; r--) {
                        piece++;
                        c++
                    }
                    // Справа свеху от конца
                    if (r < 0 || c === Columns || board[r][c] !== 0) {
                        block++;
                    }
                    score += evaluateblock(block, piece);
                }
            }
            r -= 1;
            c += 1;
        }
    }
    //Диагональ
    for (let n = min_x - (max_y - min_y); n <= max_x; n++) {
        let r = n;
        let c = min_y;
        while (r <= max_x && c <= max_y) {
            if (r >= min_x && r <= max_x) {
                if (board[r][c] === pieceType) {
                    let block = 0;
                    let piece = 1;
                    // Слева вверху от начала
                    if (c === 0 || r === 0 || board[r - 1][c - 1] !== 0) {
                        block++;
                    }
                    // Длинна диагонали подряд идущих клеток
                    r++;
                    c++;
                    for (; r < Rows && board[r][c] == pieceType; r++) {
                        piece++;
                        c++;
                    }
                    // Справа снизу от конца
                    if (r === Rows || c === Columns || board[r][c] !== 0) {
                        block++;
                    }
                    score += evaluateblock(block, piece);
                }
            }
            r += 1;
            c += 1;
        }

    }
    return score;
}

// Оценка состояния доски для каждого игрока и сохранения результата в хэше
function evaluate_state(board: number[][], player: number, hash: number, limits: number[]) {
    const noughts_score: number = eval_board(board, -1, limits);
    const crosses_score: number = eval_board(board, 1, limits);
    let score = 0;
    if (player == -1) {
        score = (noughts_score - crosses_score);
    } else {
        score = (crosses_score - noughts_score);
    }
    State_Cache.set(hash, score);
    return score;
}

//Обычный компаратор
function compare(a, b) {
    if (a.score < b.score)
        return 1;
    if (a.score > b.score)
        return -1;
    return 0;
}

// Генерация всех перспективных ходов, в виде их кординат и стоимости хода
function BoardGenerator(limits, board, player) {
    const potential_moves_score = [];
    const min_x: number = limits[0];
    const min_y: number = limits[1];
    const max_x: number = limits[2];
    const max_y: number = limits[3];;
    for (let i: number = min_x - 2; i <= max_x + 2; i++) {
        for (let j: number = min_y - 2; j <= max_y + 2; j++) {
            if (board[i][j] === 0 && !is_remote_cell(board, i, j)) {
                var move = {i: 0, j: 0, score: 0};
                move.i = i;
                move.j = j;
                let potential_score: number | boolean = evaluate_move(board, i, j, player);
                if (potential_score === IS_WIN) {
                    move.score = 1;
                    return [move]
                }
                move.score = Number(potential_score);
                potential_moves_score.push(move)
            }
        }
    }
    potential_moves_score.sort(compare);
    return potential_moves_score;
}

// Усоверешенствованный алгоритм альфа-бетта отсечения
// При ПРАВИЛЬНОМ использовании вернет самый перспективный ход для ИИ
// При рекурсивном запуске будет возвращать целое число, равное стоимости хода
function negascout(new_board: number[][], player: number, depth: number, alpha: number, beta: number, hash: number, limits: number[], last_x: number, last_y: number) {
    const alpha_original: number = alpha;
    const CacheNode = Cache.get(hash)
    if ((CacheNode !== undefined) && (CacheNode.depth >= depth)) {
        const score: number = CacheNode.score;
        if (CacheNode.Flag === 0) {
            return score
        }
        if (CacheNode.Flag === -1) {
            alpha = Math.max(alpha, score);
        } else if (CacheNode.Flag === 1) {
            beta = Math.min(beta, score);
        }
        if (alpha >= beta) {
            return score
        }
    }

    if (check_win(new_board, last_x, last_y)) {
        return -2000000 + (MaximumDepth - depth)
    }
    if (depth === 0) {
        const StateCacheNode = State_Cache.get(hash);
        if (StateCacheNode !== undefined) {
            return StateCacheNode
        }
        return evaluate_state(new_board, player, hash, limits)
    }

    const potential_moves = BoardGenerator(limits, new_board, player);
    if (potential_moves.length === 0) {
        return 0;
    }

    let b: number = beta;
    let bestscore: number = -Infinity;
    const best_move = { i: 0, j: 0, score: 0 };
    for (let y: number = 0; y < potential_moves.length; y++) {
        let i = potential_moves[y].i;
        let j = potential_moves[y].j;
        const newHash = update_hash(hash, player, i, j)
        new_board[i][j] = player;
        const restrictions_temp = change_limits(limits, i, j)
        let score = -negascout(new_board, -player, depth - 1, -b, -alpha, newHash, restrictions_temp, i, j)
        if (score > alpha && score < beta && y > 0) {
            score = -negascout(new_board, -player, depth - 1, -beta, -score, newHash, restrictions_temp, i, j)
        }
        if (score > bestscore) {
            bestscore = score
            if (depth === MaximumDepth) {
                best_move.i = i
                best_move.j = j
                best_move.score = score;
            }
        }
        new_board[i][j] = 0;
        alpha = Math.max(alpha, score)
        if (alpha >= beta) {
            break;
        }
        b = alpha + 1;
    }
    const obj = { score: bestscore, depth: depth, flag: 0 };
    if (bestscore <= alpha_original) {
        obj.flag = 1
    } else if (bestscore >= b) {
        obj.flag = -1
    }
    Cache.set(hash, obj);
    if (depth == MaximumDepth) {
        return best_move
    } else {
        return bestscore
    }
}

// Проверка, можно ли сделать ход
function check_move(board: number[][], x: number, y: number) {
    if (x >= 0 && x < Rows && y >= 0 && y < Columns)
        if (board[x][y] === 0) {
            return true;
        }
    return false;
}

// Операция хода, принимает на вход доску, кординаты хода и то чем играет игрок
function make_move(board: number[][], x: number, y: number, player: number) {
    // Если ход невозможен, возвращает доску без изменений
    if (!check_move(board, x, y)) {
        return { board: board, status_winner: 0, status_move: false }
    }
    // Игрок победил своим ходом
    board[x][y] = player;
    if (check_win(board, x, y)) {
        return { board: board, status_winner: player, status_move: true };
    }
    // Ход ИИ
    let bestmove = negascout(board, -player, MaximumDepth, -Infinity, Infinity, hash(board), create_limits(board), x, y);

    board[bestmove.i][bestmove.j] = -player;

    Cache.clear();
    State_Cache.clear();
    if (check_win(board, bestmove.i, bestmove.j)) {
        return { board: board, status_winner: -player, status_move: true };
    } 

    return { board: board, status_winner: 0, status_move: true };
}