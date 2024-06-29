const boxes = document.querySelectorAll(".box");
const images = document.querySelectorAll(".image, .image2");

// Loop through each boxes element
boxes.forEach((box) => {
  // When a draggable element is dragged over a box element
  box.addEventListener("dragover", (e) => {
    e.preventDefault(); // Prevent default behaviour
    box.classList.add("hovered");
  });

  // When a draggable element leaves a box element
  box.addEventListener("dragleave", () => {
    box.classList.remove("hovered");
  });

  // When a draggable element is dropped on a box element
  box.addEventListener("drop", (e) => {
    e.preventDefault();
    const draggedElementId = e.dataTransfer.getData("text");
    const draggedElement = document.getElementById(draggedElementId);
    box.appendChild(draggedElement);
    box.classList.remove("hovered");
  });
});

// Loop through each draggable image element
images.forEach((image) => {
  // Set unique ID for each draggable element
  image.id = `draggable-${Math.random().toString(36).substr(2, 9)}`;

  // When a draggable element starts to be dragged
  image.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text", e.target.id);
  });
});
