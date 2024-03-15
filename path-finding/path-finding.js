(function () {
  // Constants
  const STROKE_WIDTH = 2;
  const SQUARE_SIZE = 20;
  const MAZE = [
    "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "x            xxxx            x",
    "x   xxxxxxxxxx  x  xxxxxxx   x",
    "x   x           x      x     x",
    "x   x  xxxxxxxxxx      x     x",
    "x   x  x       xx      x     x",
    "x   x  x       xx      x     x",
    "x      x    x          x     x",
    "xxx xxxx    xxxxxxxxxxxx     x",
    "x                 x          e",
    "xsxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  ];
  const MZ_GOOD_PATH = "g";
  const MZ_BAD_PATH = "b";
  const MZ_WALL = "x";
  const MZ_START = "s";
  const MZ_END = "e";
  const MZ_PATH = "*";
  const SQUARE_IS = {
    out: "o",
    wall: "x",
    start: "s",
    end: "e",
    path: "*",
    seen: "S",
  };
  // Variables
  let frameRate = 500;
  let drawStack = [];

  // Dom elements
  const canvas = document.getElementById("path-finding-canvas");
  const context = canvas.getContext("2d");
  const analysisDiv = document.getElementById("path-finding-analysis");
  const speedInput = document.getElementById("path-finding-speed");
  const speedBtn = document.getElementById("path-finding-speedBtn");

  // events
  speedInput.addEventListener("change", updateFrameRate);
  speedBtn.addEventListener("click", updateFrameRate);

  // DOM setup
  speedInput.value = frameRate;
  canvas.width = MAZE[0].length * SQUARE_SIZE;
  canvas.height = MAZE.length * SQUARE_SIZE;

  // Functions
  function updateFrameRate() {
    frameRate = speedInput.value;
    start();
  }

  function getMazeStartAndEnd(maze) {
    let start;
    let end;
    for (let i = 0; i < maze.length; i++) {
      for (let j = 0; j < maze[0].length; j++) {
        if (maze[i][j] === MZ_START) start = { x: j, y: i };
        if (maze[i][j] === MZ_END) end = { x: j, y: i };
      }
    }
    if (!start || !end)
      throw new Error("Maze must have a start (s) and an end (e)");
    return { start, end };
  }

  function drawPath(maze, path, curr) {
    const mazeArr = maze.map((row) => row.split(""));

    path.forEach((p) => {
      if (mazeArr[p.y] && mazeArr[p.y][p.x]) {
        if (mazeArr[p.y][p.x] === MZ_START) return;
        if (mazeArr[p.y][p.x] === MZ_END) return;
        mazeArr[p.y][p.x] = MZ_PATH;
      }
    });

    if (curr?.good) {
      mazeArr[curr.good.y][curr.good.x] = MZ_GOOD_PATH;
    }

    if (curr?.bad) {
      mazeArr[curr.bad.y][curr.bad.x] = MZ_BAD_PATH;
    }

    return mazeArr.map((d) => d.join(""));
  }

  function drawMaze(maze) {
    context.lineWidth = STROKE_WIDTH;
    context.strokeStyle = "rgb(2,7,159)";

    // render maze
    for (var y = 0; y < maze[0].length; y++) {
      for (var x = 0; x < maze.length; x++) {
        const args = [
          y * SQUARE_SIZE,
          x * SQUARE_SIZE,
          SQUARE_SIZE,
          SQUARE_SIZE,
        ];
        if (maze[x][y] === MZ_WALL) {
          context.fillStyle = "rgb(0,0,0)";
          context.fillRect(...args);
        } else if (maze[x][y] === MZ_PATH) {
          context.fillStyle = "rgb(255,255,0)";
          context.fillRect(...args);
        } else if (maze[x][y] === MZ_START) {
          context.fillStyle = "rgb(255,0,0)";
          context.fillRect(...args);
        } else if (maze[x][y] === MZ_END) {
          context.fillStyle = "rgb(0,255,0)";
          context.fillRect(...args);
        } else if (maze[x][y] === MZ_GOOD_PATH) {
          context.fillStyle = "rgb(50,50,255)";
          context.fillRect(...args);
        } else if (maze[x][y] === MZ_BAD_PATH) {
          context.fillStyle = "rgb(255,50,50)";
          context.fillRect(...args);
        } else {
          context.fillStyle = "rgb(255,255,255)";
          context.fillRect(...args);
          context.strokeRect(...args);
        }
      }
    }
  }

  function getAnalysis(analysis) {
    if (!analysis) return () => {};

    const { relativeDir, squareIs, isPop } = analysis;

    if (isPop) {
      return () => {
        analysisDiv.insertAdjacentHTML(
          "afterbegin",
          `<p>⚠️ Going back! ⛔ ¯\\_(ツ)_/¯</p>`
        );
      };
    }

    if (relativeDir === "start")
      return () => {
        analysisDiv.insertAdjacentHTML("afterbegin", `<p>Let's start! 🚀</p>`);
      };

    const squareMessage = {
      [SQUARE_IS.out]: `Oh, this is out of the maze! 🚫`,
      [SQUARE_IS.wall]: `It's a Wall! 🚫`,
      [SQUARE_IS.start]: `It's the start!`,
      [SQUARE_IS.end]: `You made it to the end! 🏆`,
      [SQUARE_IS.path]: `Good path! ✅ Moving forward...`,
      [SQUARE_IS.seen]: `Already seen 👣`,
    };

    const relativeDirMessage = {
      top: "⬆️",
      right: "➡️",
      bottom: "⬇️",
      left: "⬅️",
    };

    const message = `${relativeDirMessage[relativeDir] || "⚠️"} ${
      squareMessage[squareIs]
    }`;

    return () => {
      analysisDiv.insertAdjacentHTML("afterbegin", `<p>${message}</p>`);
    };
  }

  function addMazeToDrawStack(maze, path, curr, analysis) {
    const drawedPath = drawPath(maze, path, curr);
    const renderAnalysis = getAnalysis(analysis);
    drawStack.push(() => {
      drawMaze(drawedPath);
      renderAnalysis();
    });
  }

  const dir = [
    [0, -1, "top"], // top
    [1, 0, "right"], // right
    [0, 1, "bottom"], // bottom
    [-1, 0, "left"], // left
  ];

  function walk(maze, wall, curr, end, seen, path, relativeDir) {
    // Base cases
    // 1. If it's out of the maze
    if (
      curr.x < 0 ||
      curr.x >= maze[0].length ||
      curr.y < 0 ||
      curr.y >= maze.length
    ) {
      addMazeToDrawStack(
        maze,
        path,
        { bad: curr },
        { relativeDir, squareIs: SQUARE_IS.out }
      ); // bad position! let's draw a red square
      return false;
    }
    // 2. If it's a wall
    if (maze[curr.y][curr.x] === wall) {
      addMazeToDrawStack(
        maze,
        path,
        { bad: curr },
        { relativeDir, squareIs: SQUARE_IS.wall }
      ); // bad position! let's draw a red square
      return false;
    }
    // 3. If it's the end
    if (curr.x === end.x && curr.y === end.y) {
      path.push(curr); // add last position to the path
      addMazeToDrawStack(
        maze,
        path,
        {},
        { relativeDir, squareIs: SQUARE_IS.end }
      );
      return true;
    }
    // 4. If has already seen
    if (seen[curr.y][curr.x]) {
      addMazeToDrawStack(
        maze,
        path,
        { bad: curr },
        { relativeDir, squareIs: SQUARE_IS.seen }
      ); // bad position! let's draw a red square
      return false;
    }

    addMazeToDrawStack(
      maze,
      path,
      { good: curr },
      { relativeDir, squareIs: SQUARE_IS.path }
    ); // good position! let's draw a green square
    // Pre
    path.push(curr);
    seen[curr.y][curr.x] = true;
    addMazeToDrawStack(maze, path);

    // Rec
    for (let i = 0; i < dir.length; i++) {
      const next = {
        x: curr.x + dir[i][0],
        y: curr.y + dir[i][1],
      };
      if (walk(maze, wall, next, end, seen, path, dir[i][2])) {
        return true;
      }
    }

    // Post
    path.pop();
    addMazeToDrawStack(maze, path, null, { isPop: true });
    return false;
  }

  let drawInterval;

  function solve(maze, start, end) {
    const path = [];
    const seen = [];
    for (let i = 0; i < maze.length; i++) {
      seen[i] = new Array(maze[0].length).fill(false);
    }
    walk(maze, MZ_WALL, start, end, seen, path, "start");

    drawInterval = setInterval(() => {
      const draw = drawStack.shift();
      if (draw) {
        draw();
      } else {
        clearInterval(drawInterval);
        document.getElementById("celebrate").innerHTML = "🎉🎉🎉🎉🎉";
      }
    }, frameRate);
  }

  function start() {
    drawStack = [];
    clearInterval(drawInterval);
    const { start, end } = getMazeStartAndEnd(MAZE);
    solve(MAZE, start, end);
  }

  start();
})();
