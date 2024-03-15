(function () {
  // Constants
  const STROKE_WIDTH = 2;
  const SQUARE_SIZE = 40;
  const SQUARE_PADDING = 5;
  const INITIAL_ARRAY = [1, 8, 3, 9, 4, 2, 7, 6, 5];
  const FONT_SIZE = 20;

  // Variables
  let drawTree = {};
  let drawStack = [];
  let frameRate = 500;
  let arrayToSort = [...INITIAL_ARRAY];

  // Dom elements
  const canvas = document.getElementById("quick-sort-canvas");
  const canvasWidth = canvas.width;
  const context = canvas.getContext("2d");
  const speedInput = document.getElementById("quick-sort-speed");
  const arrayInput = document.getElementById("quick-sort-array");
  const form = document.getElementById("quick-sort-options-form");

  // events
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    frameRate = e.target.querySelector("#quick-sort-speed").value;
    const arrayInput = e.target.querySelector("#quick-sort-array");
    arrayToSort = arrayInput.value.split(",").map((n) => {
      const num = parseInt(n);
      if (isNaN(num)) {
        const msg = `Invalid array: '${n}' is not a number`;
        alert(msg);
        throw new Error(msg);
      }
      return num;
    });
    start();
  });

  // Dom setup
  speedInput.value = frameRate;
  arrayInput.value = arrayToSort.join(", ");

  // Logic
  context.lineWidth = STROKE_WIDTH;
  context.strokeStyle = "rgb(2,7,159)";
  context.font = `${FONT_SIZE}px Arial`;

  // Functions
  function drawNode(node, point, previousPoint) {
    if (!node) return;

    // draw line from this point to previous point
    if (previousPoint) {
      // Define a new Path:
      context.beginPath();
      // Define a start Point
      context.moveTo(point[0] + (node.arr.length * SQUARE_SIZE) / 2, point[1]);
      // Define an end Point
      context.lineTo(previousPoint[0], previousPoint[1]);
      // Stroke it (Do the Drawing)
      context.stroke();
    }

    let [startX, startY] = point;

    let endX = startX;
    for (let i = 0; i < node.arr.length; i++) {
      const x = startX + i * SQUARE_SIZE;
      const textX = x + SQUARE_SIZE / 2 - (FONT_SIZE / 2 - STROKE_WIDTH);
      const textY = startY + FONT_SIZE + STROKE_WIDTH / 2 + SQUARE_PADDING;
      context.strokeRect(x, startY, SQUARE_SIZE, SQUARE_SIZE);
      if (node.pivot === node.arr[i]) {
        context.fillStyle = "rgb(255, 100, 100)";
      }
      context.fillText(node.arr[i], textX, textY);
      endX += SQUARE_SIZE;
      context.fillStyle = "rgb(0,0,0)";
    }

    drawNode(
      node.left,
      [
        startX - ((node.left?.arr.length || 0) * SQUARE_SIZE) / 2,
        startY + SQUARE_SIZE * 2,
      ],
      [startX + (node.arr.length * SQUARE_SIZE) / 2, startY + SQUARE_SIZE]
    );
    drawNode(
      node.right,
      [
        endX - ((node.right?.arr.length || 0) * SQUARE_SIZE) / 2,
        startY + SQUARE_SIZE * 2,
      ],
      [startX + (node.arr.length * SQUARE_SIZE) / 2, startY + SQUARE_SIZE]
    );
  }

  function drawFinalArray(arr, startX, startY) {
    for (let i = 0; i < arr.length; i++) {
      const x = startX + i * SQUARE_SIZE;
      const textX = x + SQUARE_SIZE / 2 - (FONT_SIZE / 2 - STROKE_WIDTH);
      const textY = startY + FONT_SIZE + STROKE_WIDTH / 2 + SQUARE_PADDING;
      context.fillStyle = `rgb(255,${250 - arr[i] * 20},${250 - arr[i] * 20})`;
      context.fillRect(x, startY, SQUARE_SIZE, SQUARE_SIZE);
      context.strokeRect(x, startY, SQUARE_SIZE, SQUARE_SIZE);
      context.fillStyle = "rgb(0,0,0)";
      context.fillText(arr[i], textX, textY);
    }
  }

  function drawTreeToCanvas(tree, finalArray) {
    const arrayLength = tree.root.arr.length;
    const initialX = (canvasWidth - arrayLength * SQUARE_SIZE) / 2;
    let initialY = 10;

    drawFinalArray(finalArray, initialX, initialY);

    initialY += SQUARE_SIZE * 2;

    drawNode(tree.root, [initialX, initialY]);
  }

  function addToDrawTree(pivot, arr, lo, hi, dir, prevNode) {
    const node = {
      pivot,
      arr: arr.slice(lo, hi + 1),
      left: null,
      right: null,
    };
    prevNode[dir] = node;
    drawStack.push({ tree: JSON.stringify(drawTree), finalArray: [...arr] });
    return node;
  }

  function get_pivot(arr, lo, hi, dir, prevNode) {
    const pivot = arr[hi];

    let node = addToDrawTree(pivot, arr, lo, hi, dir, prevNode);

    let idx = lo;

    for (let i = lo; i < hi; i++) {
      if (arr[i] <= pivot) {
        const temp = arr[i];
        arr[i] = arr[idx];
        arr[idx] = temp;
        idx++;
      }
    }

    arr[hi] = arr[idx];
    arr[idx] = pivot;

    node = addToDrawTree(pivot, arr, lo, hi, dir, prevNode);

    return [idx, node];
  }

  function qs(arr, lo, hi, dir, treeNode) {
    if (lo >= hi) {
      if (lo === hi) {
        addToDrawTree(arr[lo], arr, lo, hi, dir, treeNode);
      }
      return;
    }

    const [pivotIdx, pivotNode] = get_pivot(arr, lo, hi, dir, treeNode);

    qs(arr, lo, pivotIdx - 1, "left", pivotNode);
    qs(arr, pivotIdx + 1, hi, "right", pivotNode);
  }

  function quick_sort(arr) {
    qs(arr, 0, arr.length - 1, "root", drawTree);
  }

  let drawInterval;

  function start() {
    drawStack = [];
    drawTree = {};
    quick_sort([...arrayToSort]);

    clearInterval(drawInterval); // in case the restart interrupted the previous interval

    drawInterval = setInterval(() => {
      const draw = drawStack.shift();
      if (draw) {
        drawTree = JSON.parse(draw.tree);
        context.clearRect(0, 0, canvasWidth, canvas.height);
        drawTreeToCanvas(drawTree, draw.finalArray);
      } else {
        clearInterval(drawInterval);
      }
    }, frameRate);
  }

  start();
})();
