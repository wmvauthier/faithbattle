const boxes = document.querySelectorAll(".box");
const images = document.querySelectorAll(".image, .image2");

// Loop through each boxes element
boxes.forEach((box) => {
  fillIconBox(box);

  box.addEventListener("dragover", (e) => {
    e.preventDefault();
    box.classList.add("hovered");
  });

  box.addEventListener("dragleave", () => {
    box.classList.remove("hovered");
  });

  // box.addEventListener("mouseover", () => {
  //   // Verifica se algum dos filhos tem uma classe que começa com 'image'
  //   const imageChild = box.querySelector('[class^="image"]');
  //   if (imageChild) {
  //     console.log("Image child found:");
  //     console.log(imageChild);
  //   }
  // });

  // box.addEventListener("mouseout", () => {
  //   console.log("mouseout");
  //   console.log(box);
  // });

  // When a draggable element is dropped on a box element
  box.addEventListener("drop", (e) => {
    e.preventDefault();
    const draggedElementId = e.dataTransfer.getData("text");
    const draggedElement = document.getElementById(draggedElementId);

    // Verifica se o box tem um único filho e se esse filho é um elemento 'i'
    if (
      box.children.length === 1 &&
      box.children[0].tagName.toLowerCase() === "i"
    ) {
      box.replaceChild(draggedElement, box.children[0]);
    } else {
      box.appendChild(draggedElement);
    }

    box.classList.remove("hovered");

    boxes.forEach((box) => {
      fillIconBox(box);
    });
  });
});

document.querySelectorAll(".box .image").forEach((imageDiv) => {
  imageDiv.addEventListener("mouseover", () => {
    const classes = imageDiv.classList;
    let imageUrl = "";

    classes.forEach((className) => {
      if (className.startsWith("image")) {
        const bgImage = imageDiv.style.backgroundImage;
        imageUrl = bgImage.slice(5, -2); // Extrai a URL da imagem de fundo
      }
    });

    document.querySelector(".previewImgHover").src = imageUrl;
  });
});

images.forEach((image) => {
  image.id = `draggable-${Math.random().toString(36).substr(2, 9)}`;

  image.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text", e.target.id);
  });
});

function fillIconBox(box) {
  if (box.children.length === 0) {
    let iconClass;
    // Verifica a classe do box e define a classe do ícone
    if (box.classList.contains("extraBox")) {
      iconClass = "fa-circle-plus";
    } else if (box.classList.contains("graveyardBox")) {
      iconClass = "fa-skull";
    } else if (box.classList.contains("handBox")) {
      iconClass = "fa-hand";
    } else if (box.classList.contains("knownZoneBox")) {
      iconClass = "fa-rotate";
    } else if (box.classList.contains("preparationZoneBox")) {
      iconClass = "fa-hourglass-half";
    } else if (box.classList.contains("battleZoneBox")) {
      iconClass = "fa-shield";
    } else if (box.classList.contains("battleAreaBoxUp")) {
      iconClass = "fa-circle-chevron-up";
    } else if (box.classList.contains("battleAreaBoxDown")) {
      iconClass = "fa-circle-chevron-down";
    }

    if (iconClass) {
      const iconElement = document.createElement("i");
      iconElement.classList.add("fas", "fa", "fa-solid", iconClass);
      box.appendChild(iconElement);
    }
  }
}
