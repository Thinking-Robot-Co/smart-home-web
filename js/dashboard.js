// js/dashboard.js
import { getDatabase, ref, onChildAdded, onChildRemoved, remove, push } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

const auth = getAuth();
const db = getDatabase();
let currentUserUid = null;

// Hardcoded array of available icon filenames (for both room and node creation)
const availableIcons = [
  "cook.png", "kitchen.png", "sofa.png", "chair.png", "study.png",
  "bed.png", "lamp.png", "tv.png", "fan.png", "ac.png",
  "table.png", "window.png", "door.png", "book.png", "plant.png",
  "computer.png", "stove.png", "fridge.png", "oven.png", "microwave.png",
  "vacuum.png", "clock.png", "radio.png", "console.png", "shelf.png",
  "dining.png", "garage.png", "bath.png", "mirror.png", "curtain.png",
  "office.png", "podcast.png", "heater.png", "projector.png", "stereo.png",
  "printer.png", "router.png", "wireless.png", "basement.png", "attic.png",
  "porch.png", "balcony.png", "garden.png", "entry.png", "lobby.png"
];

const roomsContainer = document.getElementById("rooms-container");
const addRoomBtn = document.getElementById("add-room-btn");

// Modal elements
const roomCreationModal = document.getElementById("roomCreationModal");
const closeRoomCreation = document.getElementById("closeRoomCreation");
const saveRoomBtn = document.getElementById("saveRoomBtn");
const newRoomNameInput = document.getElementById("newRoomName");
const roomIconPalette = document.getElementById("roomIconPalette");

const nodeCreationModal = document.getElementById("nodeCreationModal");
const closeNodeCreation = document.getElementById("closeNodeCreation");
const saveNodeBtn = document.getElementById("saveNodeBtn");
const newNodeNameInput = document.getElementById("newNodeName");
const nodeIconPalette = document.getElementById("nodeIconPalette");

const roomModal = document.getElementById("roomModal");
const closeRoomModal = document.getElementById("closeRoomModal");
const roomModalTitle = document.getElementById("roomModalTitle");
const roomModalNodesContainer = document.getElementById("roomModalNodesContainer");
const addNodeInRoomBtn = document.getElementById("addNodeInRoomBtn");

// Variable to keep track of which room is being edited/added nodes to:
let currentRoomKeyForNode = null;

// When auth state changes, load dashboard and rooms
auth.onAuthStateChanged(user => {
  if (user) {
    currentUserUid = user.uid;
    loadUserProfile();
    loadRooms();
  } else {
    window.location.href = "login.html";
  }
});

// Load user's profile to display username
function loadUserProfile() {
  const profileRef = ref(db, "users/" + currentUserUid + "/profile");
  onChildAdded(profileRef, snapshot => {
    if (snapshot.key === "username") {
      document.getElementById("displayName").textContent = snapshot.val();
    }
  });
}

// Load rooms from Firebase
function loadRooms() {
  const roomsRef = ref(db, "users/" + currentUserUid + "/rooms");
  onChildAdded(roomsRef, snapshot => {
    const roomData = snapshot.val();
    const roomKey = snapshot.key;
    createRoomCard(roomKey, roomData);
  });
  onChildRemoved(roomsRef, snapshot => {
    const roomKey = snapshot.key;
    const roomCard = document.getElementById("room-" + roomKey);
    if (roomCard) roomCard.remove();
  });
}

// Create a room card element
function createRoomCard(roomKey, roomData) {
  const roomCard = document.createElement("div");
  roomCard.classList.add("room-card");
  roomCard.id = "room-" + roomKey;

  const header = document.createElement("h3");
  header.textContent = roomData.name;
  roomCard.appendChild(header);

  // Right-click to delete room
  roomCard.addEventListener("contextmenu", e => {
    e.preventDefault();
    if (confirm("Delete room '" + roomData.name + "'?")) {
      remove(ref(db, "users/" + currentUserUid + "/rooms/" + roomKey));
    }
  });

  // Click on room to open room modal
  roomCard.addEventListener("click", e => {
    // Avoid conflict if user clicked the add node button inside the card
    if (e.target.tagName.toLowerCase() !== "button") {
      openRoomModal(roomKey, roomData);
    }
  });

  // Container for nodes
  const nodesContainer = document.createElement("div");
  nodesContainer.classList.add("nodes-container");
  roomCard.appendChild(nodesContainer);

  // Load existing nodes for this room
  const roomNodesRef = ref(db, "users/" + currentUserUid + "/rooms/" + roomKey + "/nodes");
  onChildAdded(roomNodesRef, snapshot => {
    const nodeData = snapshot.val();
    const nodeKey = snapshot.key;
    addNodeItem(nodesContainer, roomKey, nodeKey, nodeData);
  });
  onChildRemoved(roomNodesRef, snapshot => {
    const nodeKey = snapshot.key;
    const nodeElem = document.getElementById("node-" + roomKey + "-" + nodeKey);
    if (nodeElem) nodeElem.remove();
  });

  // Button to add node (optional: we can keep it here or only inside room modal)
  const addNodeBtn = document.createElement("button");
  addNodeBtn.classList.add("add-node");
  addNodeBtn.textContent = "+ Add Node";
  addNodeBtn.onclick = e => {
    // Prevent propagation so that clicking add node doesn't open room modal
    e.stopPropagation();
    openNodeCreationModal(roomKey);
  };
  roomCard.appendChild(addNodeBtn);

  roomsContainer.appendChild(roomCard);
}

// Append a node item to a container (in room card or in room modal)
function addNodeItem(container, roomKey, nodeKey, nodeData) {
  const nodeItem = document.createElement("div");
  nodeItem.classList.add("node-item");
  nodeItem.id = "node-" + roomKey + "-" + nodeKey;

  const iconImg = document.createElement("img");
  iconImg.src = "assets/images/" + nodeData.icon;
  iconImg.alt = nodeData.name;
  nodeItem.appendChild(iconImg);

  const nodeLabel = document.createElement("span");
  nodeLabel.textContent = nodeData.name;
  nodeItem.appendChild(nodeLabel);

  // Add options topbar for node (modify, delete, duplicate, pin)
  // Here we simply add a small button for deletion as an example.
  const optionsBtn = document.createElement("button");
  optionsBtn.textContent = "⋮";
  optionsBtn.classList.add("node-options-btn");
  optionsBtn.onclick = function(e) {
    e.stopPropagation();
    showNodeOptions(roomKey, nodeKey, nodeData, nodeItem);
  };
  nodeItem.insertBefore(optionsBtn, nodeItem.firstChild);

  container.appendChild(nodeItem);
}

// Show node options (modify, delete, duplicate, pin) in a small popup style
function showNodeOptions(roomKey, nodeKey, nodeData, nodeItem) {
  // For simplicity, we create a basic prompt-like options panel.
  // You can replace this with a styled modal/popup.
  const action = prompt("Enter action: (delete, duplicate, pin, modify)", "delete");
  if (action === "delete") {
    remove(ref(db, "users/" + currentUserUid + "/rooms/" + roomKey + "/nodes/" + nodeKey));
  } else if (action === "duplicate") {
    // Duplicate node: push a new node with same data
    push(ref(db, "users/" + currentUserUid + "/rooms/" + roomKey + "/nodes"), nodeData);
  } else if (action === "modify") {
    const newName = prompt("Enter new name:", nodeData.name);
    if (newName) {
      // Update node name
      const nodeRef = ref(db, "users/" + currentUserUid + "/rooms/" + roomKey + "/nodes/" + nodeKey);
      // For simplicity we only update name; you can add icon change similarly.
      nodeRef.update({ name: newName });
    }
  } else if (action === "pin") {
    // For pinning, you may update a separate property. Here, we simply log it.
    console.log("Node pinned:", nodeData);
    alert("Node pinned! (This will add the node to a top bar later.)");
  }
}

// Open the room creation modal and build icon palette dynamically
function openRoomCreationModal() {
  roomCreationModal.style.display = "block";
  newRoomNameInput.value = "";
  roomIconPalette.innerHTML = "";
  availableIcons.forEach(icon => {
    const img = document.createElement("img");
    img.src = "assets/images/" + icon;
    img.alt = icon;
    img.classList.add("icon-option");
    // Clicking an icon highlights it and sets a selected attribute
    img.addEventListener("click", () => {
      // Remove highlight from other icons
      document.querySelectorAll("#roomIconPalette img").forEach(i => i.classList.remove("selected"));
      img.classList.add("selected");
    });
    roomIconPalette.appendChild(img);
  });
}

// Save new room from modal
saveRoomBtn.addEventListener("click", function() {
  const roomName = newRoomNameInput.value.trim();
  const selectedIconEl = document.querySelector("#roomIconPalette img.selected");
  if (!roomName) {
    alert("Please enter a room name.");
    return;
  }
  // For room creation, you might store the chosen icon as a room icon.
  const roomIcon = selectedIconEl ? selectedIconEl.alt : "default_room.png";
  push(ref(db, "users/" + currentUserUid + "/rooms"), { name: roomName, icon: roomIcon });
  roomCreationModal.style.display = "none";
});

// Open node creation modal; set global variable to know which room
function openNodeCreationModal(roomKey) {
  currentRoomKeyForNode = roomKey;
  nodeCreationModal.style.display = "block";
  newNodeNameInput.value = "";
  nodeIconPalette.innerHTML = "";
  availableIcons.forEach(icon => {
    const img = document.createElement("img");
    img.src = "assets/images/" + icon;
    img.alt = icon;
    img.classList.add("icon-option");
    img.addEventListener("click", () => {
      document.querySelectorAll("#nodeIconPalette img").forEach(i => i.classList.remove("selected"));
      img.classList.add("selected");
    });
    nodeIconPalette.appendChild(img);
  });
}

// Save node from node creation modal
saveNodeBtn.addEventListener("click", function() {
  const nodeName = newNodeNameInput.value.trim();
  const selectedIconEl = document.querySelector("#nodeIconPalette img.selected");
  if (!nodeName) {
    alert("Please enter a node name.");
    return;
  }
  const nodeIcon = selectedIconEl ? selectedIconEl.alt : "default_node.png";
  push(ref(db, "users/" + currentUserUid + "/rooms/" + currentRoomKeyForNode + "/nodes"), { name: nodeName, icon: nodeIcon });
  nodeCreationModal.style.display = "none";
});

// Open room modal to view nodes in a room
function openRoomModal(roomKey, roomData) {
  roomModal.style.display = "block";
  roomModalTitle.textContent = roomData.name;
  roomModalNodesContainer.innerHTML = "";  // Clear previous data
  currentRoomKeyForNode = roomKey;
  // Load nodes for this room
  const roomNodesRef = ref(db, "users/" + currentUserUid + "/rooms/" + roomKey + "/nodes");
  onChildAdded(roomNodesRef, snapshot => {
    const nodeData = snapshot.val();
    const nodeKey = snapshot.key;
    addNodeItem(roomModalNodesContainer, roomKey, nodeKey, nodeData);
  });
}

// Close modal events
closeRoomCreation.onclick = function() {
  roomCreationModal.style.display = "none";
};
closeNodeCreation.onclick = function() {
  nodeCreationModal.style.display = "none";
};
closeRoomModal.onclick = function() {
  roomModal.style.display = "none";
};

// When the user clicks anywhere outside the modal, close it
window.onclick = function(event) {
  if (event.target === roomCreationModal) {
    roomCreationModal.style.display = "none";
  }
  if (event.target === nodeCreationModal) {
    nodeCreationModal.style.display = "none";
  }
  if (event.target === roomModal) {
    roomModal.style.display = "none";
  }
};

// Add event listener for "+ Add Room" button to open room creation modal
addRoomBtn.addEventListener("click", openRoomCreationModal);

// In the room modal, add event listener for adding a node
addNodeInRoomBtn.addEventListener("click", () => {
  openNodeCreationModal(currentRoomKeyForNode);
});
