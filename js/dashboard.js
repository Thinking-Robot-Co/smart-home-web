// js/dashboard.js
import { getDatabase, ref, onChildAdded, onChildRemoved, remove, push, update } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";
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

// Modal elements for room/node creation are assumed to be set up as before
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

// Global variable: to track which room to add nodes to.
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

// Load user's profile to display username on dashboard.
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

  // Container for nodes in this room
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

  // Button to add node (opens node creation modal)
  const addNodeBtn = document.createElement("button");
  addNodeBtn.classList.add("add-node");
  addNodeBtn.textContent = "+ Add Node";
  addNodeBtn.onclick = e => {
    e.stopPropagation(); // Prevent room card click from firing
    openNodeCreationModal(roomKey);
  };
  roomCard.appendChild(addNodeBtn);

  // Additionally, add a button to open device provisioning page for this node setup.
  // For example, a "Configure Device" button that opens the ESP provisioning page.
  const configureBtn = document.createElement("button");
  configureBtn.classList.add("configure-device-btn");
  configureBtn.textContent = "Configure Device";
  configureBtn.onclick = e => {
    e.stopPropagation();
    // In a real scenario, you might have stored the device's IP or allow the user to input it.
    let deviceIP = prompt("Enter device IP for provisioning (default: 192.168.4.1):", "192.168.4.1");
    if (deviceIP) {
      window.open("http://" + deviceIP, "_blank");
    }
  };
  roomCard.appendChild(configureBtn);

  roomsContainer.appendChild(roomCard);
}

// Append a node item to a container (used in both room card and room modal)
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

  // Add an "On/Off" toggle button
  const toggleBtn = document.createElement("button");
  toggleBtn.classList.add("toggle-btn");
  // Initialize state if not set
  if (!nodeData.state) {
    nodeData.state = "OFF";
  }
  toggleBtn.textContent = (nodeData.state === "ON") ? "Turn Off" : "Turn On";
  toggleBtn.onclick = function(e) {
    e.stopPropagation();
    let newState = (nodeData.state === "ON") ? "OFF" : "ON";
    // Update Firebase value for state
    const nodeRef = ref(db, "users/" + currentUserUid + "/rooms/" + roomKey + "/nodes/" + nodeKey);
    update(nodeRef, { state: newState });
    // Update UI immediately
    toggleBtn.textContent = (newState === "ON") ? "Turn Off" : "Turn On";
    nodeData.state = newState;
  };
  nodeItem.appendChild(toggleBtn);

  // If the node is not provisioned, show a "Configure" button; assume a node is provisioned if nodeData.provisioned is true.
  if (!nodeData.provisioned) {
    const configBtn = document.createElement("button");
    configBtn.classList.add("configure-btn");
    configBtn.textContent = "Configure";
    configBtn.onclick = function(e) {
      e.stopPropagation();
      let deviceIP = prompt("Enter device IP for provisioning (default: 192.168.4.1):", "192.168.4.1");
      if (deviceIP) {
        window.open("http://" + deviceIP, "_blank");
      }
    };
    nodeItem.appendChild(configBtn);
  }

  // Add a small options button for further actions (modify, delete, duplicate, pin)
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

// Show node options in a simple prompt (can be replaced with a styled modal)
function showNodeOptions(roomKey, nodeKey, nodeData, nodeItem) {
  const action = prompt("Enter action: (delete, duplicate, modify, pin)", "delete");
  if (action === "delete") {
    remove(ref(db, "users/" + currentUserUid + "/rooms/" + roomKey + "/nodes/" + nodeKey));
  } else if (action === "duplicate") {
    push(ref(db, "users/" + currentUserUid + "/rooms/" + roomKey + "/nodes"), nodeData);
  } else if (action === "modify") {
    const newName = prompt("Enter new name:", nodeData.name);
    if (newName) {
      const nodeRef = ref(db, "users/" + currentUserUid + "/rooms/" + roomKey + "/nodes/" + nodeKey);
      update(nodeRef, { name: newName });
    }
  } else if (action === "pin") {
    console.log("Node pinned:", nodeData);
    alert("Node pinned! (This will add the node to a top bar later.)");
  }
}

// --- Modal logic for creating room ---

function openRoomCreationModal() {
  roomCreationModal.style.display = "block";
  newRoomNameInput.value = "";
  roomIconPalette.innerHTML = "";
  availableIcons.forEach(icon => {
    const img = document.createElement("img");
    img.src = "assets/images/" + icon;
    img.alt = icon;
    img.classList.add("icon-option");
    img.addEventListener("click", () => {
      document.querySelectorAll("#roomIconPalette img").forEach(i => i.classList.remove("selected"));
      img.classList.add("selected");
    });
    roomIconPalette.appendChild(img);
  });
}

saveRoomBtn.addEventListener("click", function() {
  const roomName = newRoomNameInput.value.trim();
  const selectedIconEl = document.querySelector("#roomIconPalette img.selected");
  if (!roomName) {
    alert("Please enter a room name.");
    return;
  }
  const roomIcon = selectedIconEl ? selectedIconEl.alt : "default_room.png";
  push(ref(db, "users/" + currentUserUid + "/rooms"), { name: roomName, icon: roomIcon });
  roomCreationModal.style.display = "none";
});

// --- Modal logic for creating node ---
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

saveNodeBtn.addEventListener("click", function() {
  const nodeName = newNodeNameInput.value.trim();
  const selectedIconEl = document.querySelector("#nodeIconPalette img.selected");
  if (!nodeName) {
    alert("Please enter a node name.");
    return;
  }
  const nodeIcon = selectedIconEl ? selectedIconEl.alt : "default_node.png";
  push(ref(db, "users/" + currentUserUid + "/rooms/" + currentRoomKeyForNode + "/nodes"), { name: nodeName, icon: nodeIcon, state: "OFF", provisioned: false });
  nodeCreationModal.style.display = "none";
});

// --- Modal logic for room details ---
function openRoomModal(roomKey, roomData) {
  roomModal.style.display = "block";
  roomModalTitle.textContent = roomData.name;
  roomModalNodesContainer.innerHTML = "";
  currentRoomKeyForNode = roomKey;
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

// When user clicks outside a modal, close it.
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

// Event listeners for modals
addRoomBtn.addEventListener("click", openRoomCreationModal);
addNodeInRoomBtn.addEventListener("click", () => {
  openNodeCreationModal(currentRoomKeyForNode);
});
