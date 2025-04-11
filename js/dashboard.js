// js/dashboard.js
import { getDatabase, ref, onChildAdded, onChildRemoved, remove, push, update } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

const auth = getAuth();
const db = getDatabase();
let currentUserUid = null;

// Global icon list – you can expand or later load dynamically
const iconNames = [
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

// Ensure the user is authenticated and then load data
auth.onAuthStateChanged(user => {
  if (user) {
    currentUserUid = user.uid;
    // Load display name from profile
    const profileRef = ref(db, "users/" + user.uid + "/profile");
    onChildAdded(profileRef, snapshot => {
      if (snapshot.key === "username") {
        document.getElementById("displayName").textContent = snapshot.val();
      }
    });
    loadRooms();
  } else {
    window.location.href = "login.html";
  }
});

const roomsContainer = document.getElementById("rooms-container");
const addRoomBtn = document.getElementById("add-room-btn");

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

// Create room card element
function createRoomCard(roomKey, roomData) {
  const roomCard = document.createElement("div");
  roomCard.classList.add("room-card");
  roomCard.id = "room-" + roomKey;
  
  // Header with room name and icon for modification
  const header = document.createElement("h3");
  header.textContent = roomData.name;
  roomCard.appendChild(header);
  
  // Right-click on room header for delete or modify options
  header.addEventListener("contextmenu", e => {
    e.preventDefault();
    // Show room options popup for delete/modify
    showRoomOptionsPopup(roomKey, roomData);
  });
  
  // Container for nodes
  const nodesContainer = document.createElement("div");
  nodesContainer.classList.add("nodes-container");
  roomCard.appendChild(nodesContainer);
  
  // Listen for nodes inside this room
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
  
  // Button to add a node to this room – opens node popup
  const addNodeBtn = document.createElement("button");
  addNodeBtn.classList.add("add-node");
  addNodeBtn.textContent = "+ Add Node";
  addNodeBtn.onclick = () => {
    showAddNodePopup(roomKey);
  };
  roomCard.appendChild(addNodeBtn);
  
  // When room card is clicked (not right-click), open room details (optional)
  roomCard.addEventListener("click", () => {
    showRoomDetailPopup(roomKey, roomData);
  });
  
  roomsContainer.appendChild(roomCard);
}

// Create node element inside a room
function addNodeItem(container, roomKey, nodeKey, nodeData) {
  const nodeItem = document.createElement("div");
  nodeItem.classList.add("node-item");
  nodeItem.id = "node-" + roomKey + "-" + nodeKey;
  
  // Topbar for node actions
  const nodeTopbar = document.createElement("div");
  nodeTopbar.classList.add("node-topbar");
  // Create buttons: Modify, Delete, Duplicate, Pin
  const actions = [
    { label: "Modify", action: () => modifyNode(roomKey, nodeKey, nodeData) },
    { label: "Delete", action: () => deleteNode(roomKey, nodeKey) },
    { label: "Duplicate", action: () => duplicateNode(roomKey, nodeKey, nodeData) },
    { label: "Pin", action: () => pinNode(roomKey, nodeKey) }
  ];
  actions.forEach(item => {
    const btn = document.createElement("button");
    btn.textContent = item.label;
    btn.onclick = e => {
      e.stopPropagation();
      item.action();
    };
    nodeTopbar.appendChild(btn);
  });
  nodeItem.appendChild(nodeTopbar);
  
  // Node icon and label
  const iconImg = document.createElement("img");
  iconImg.src = "assets/images/" + nodeData.icon;
  iconImg.alt = nodeData.name;
  nodeItem.appendChild(iconImg);
  
  const nodeLabel = document.createElement("span");
  nodeLabel.textContent = nodeData.name;
  nodeItem.appendChild(nodeLabel);
  
  container.appendChild(nodeItem);
}

// ----- Popup functions -----

// Utility: Create modal popup container
function createModal(contentHtml) {
  const modalOverlay = document.createElement("div");
  modalOverlay.classList.add("modal-overlay");
  const modal = document.createElement("div");
  modal.classList.add("modal");
  modal.innerHTML = contentHtml;
  modalOverlay.appendChild(modal);
  // Clicking outside modal closes it
  modalOverlay.addEventListener("click", e => {
    if (e.target === modalOverlay) {
      modalOverlay.remove();
    }
  });
  document.getElementById("modalContainer").appendChild(modalOverlay);
  return modalOverlay;
}

// Show popup for adding a room with palette for icon selection
function showAddRoomPopup() {
  let selectedIcon = "";
  const content = `
    <h3>Add New Room</h3>
    <input type="text" id="newRoomName" placeholder="Room Name" required />
    <div class="icon-palette" id="roomIconPalette"></div>
    <div class="modal-actions">
      <button class="cancel" id="cancelRoomBtn">Cancel</button>
      <button class="confirm" id="confirmRoomBtn">Add Room</button>
    </div>
  `;
  const modalOverlay = createModal(content);
  
  // Populate icon palette
  const palette = modalOverlay.querySelector("#roomIconPalette");
  iconNames.forEach(icon => {
    const img = document.createElement("img");
    img.src = "assets/images/" + icon;
    img.alt = icon;
    img.onclick = function() {
      // Mark this icon as selected
      palette.querySelectorAll("img").forEach(i => i.classList.remove("selected"));
      img.classList.add("selected");
      selectedIcon = icon;
    };
    palette.appendChild(img);
  });
  
  // Cancel button
  modalOverlay.querySelector("#cancelRoomBtn").onclick = () => {
    modalOverlay.remove();
  };
  
  // Confirm button
  modalOverlay.querySelector("#confirmRoomBtn").onclick = () => {
    const roomName = modalOverlay.querySelector("#newRoomName").value.trim();
    if (!roomName) {
      alert("Please enter a room name.");
      return;
    }
    if (!selectedIcon) {
      alert("Please select an icon for the room.");
      return;
    }
    // Save room to Firebase with chosen icon (store icon along with name)
    push(ref(db, "users/" + currentUserUid + "/rooms"), { name: roomName, icon: selectedIcon });
    modalOverlay.remove();
  };
}

// Show popup for adding a node to a room
function showAddNodePopup(roomKey) {
  let selectedIcon = "";
  const content = `
    <h3>Add New Node</h3>
    <input type="text" id="newNodeName" placeholder="Node Name" required />
    <div class="icon-palette" id="nodeIconPalette"></div>
    <div class="modal-actions">
      <button class="cancel" id="cancelNodeBtn">Cancel</button>
      <button class="confirm" id="confirmNodeBtn">Add Node</button>
    </div>
  `;
  const modalOverlay = createModal(content);
  
  const palette = modalOverlay.querySelector("#nodeIconPalette");
  iconNames.forEach(icon => {
    const img = document.createElement("img");
    img.src = "assets/images/" + icon;
    img.alt = icon;
    img.onclick = function() {
      palette.querySelectorAll("img").forEach(i => i.classList.remove("selected"));
      img.classList.add("selected");
      selectedIcon = icon;
    };
    palette.appendChild(img);
  });
  
  modalOverlay.querySelector("#cancelNodeBtn").onclick = () => {
    modalOverlay.remove();
  };
  
  modalOverlay.querySelector("#confirmNodeBtn").onclick = () => {
    const nodeName = modalOverlay.querySelector("#newNodeName").value.trim();
    if (!nodeName) {
      alert("Please enter a node name.");
      return;
    }
    if (!selectedIcon) {
      alert("Please select an icon for the node.");
      return;
    }
    // Save node data in Firebase under the given room
    push(ref(db, "users/" + currentUserUid + "/rooms/" + roomKey + "/nodes"), { name: nodeName, icon: selectedIcon });
    modalOverlay.remove();
  };
}

// Show popup for room options on right-click (delete, modify)
// For simplicity we include "Modify" and "Delete" here.
function showRoomOptionsPopup(roomKey, roomData) {
  const content = `
    <h3>Room Options</h3>
    <button id="modifyRoomBtn">Modify Room</button>
    <button id="deleteRoomBtn">Delete Room</button>
    <button id="cancelRoomOptionsBtn">Cancel</button>
  `;
  const modalOverlay = createModal(content);
  
  modalOverlay.querySelector("#cancelRoomOptionsBtn").onclick = () => {
    modalOverlay.remove();
  };
  
  modalOverlay.querySelector("#deleteRoomBtn").onclick = () => {
    if (confirm("Are you sure you want to delete room '" + roomData.name + "'?")) {
      remove(ref(db, "users/" + currentUserUid + "/rooms/" + roomKey));
      modalOverlay.remove();
    }
  };
  
  modalOverlay.querySelector("#modifyRoomBtn").onclick = () => {
    modalOverlay.remove();
    // For modification, we can reuse the add room popup pre-filled with current values.
    showModifyRoomPopup(roomKey, roomData);
  };
}

// Example function for modifying a room (similar to add, but pre-filled)
function showModifyRoomPopup(roomKey, roomData) {
  let selectedIcon = roomData.icon || "";
  const content = `
    <h3>Modify Room</h3>
    <input type="text" id="modRoomName" placeholder="Room Name" required value="${roomData.name}" />
    <div class="icon-palette" id="modRoomIconPalette"></div>
    <div class="modal-actions">
      <button class="cancel" id="cancelModRoomBtn">Cancel</button>
      <button class="confirm" id="confirmModRoomBtn">Save Changes</button>
    </div>
  `;
  const modalOverlay = createModal(content);
  
  const palette = modalOverlay.querySelector("#modRoomIconPalette");
  iconNames.forEach(icon => {
    const img = document.createElement("img");
    img.src = "assets/images/" + icon;
    img.alt = icon;
    // Preselect the current icon
    if (icon === selectedIcon) img.classList.add("selected");
    img.onclick = function() {
      palette.querySelectorAll("img").forEach(i => i.classList.remove("selected"));
      img.classList.add("selected");
      selectedIcon = icon;
    };
    palette.appendChild(img);
  });
  
  modalOverlay.querySelector("#cancelModRoomBtn").onclick = () => {
    modalOverlay.remove();
  };
  
  modalOverlay.querySelector("#confirmModRoomBtn").onclick = () => {
    const modRoomName = modalOverlay.querySelector("#modRoomName").value.trim();
    if (!modRoomName) {
      alert("Please enter a room name.");
      return;
    }
    if (!selectedIcon) {
      alert("Please select an icon.");
      return;
    }
    // Update room data
    update(ref(db, "users/" + currentUserUid + "/rooms/" + roomKey), {
      name: modRoomName,
      icon: selectedIcon
    });
    modalOverlay.remove();
  };
}

// Node topbar options functions (placeholders)
function modifyNode(roomKey, nodeKey, nodeData) {
  // For modify, simply alert; you can implement a similar popup as add node.
  console.log("Modify node", roomKey, nodeKey, nodeData);
  alert("Modify node functionality to be implemented.");
}
function deleteNode(roomKey, nodeKey) {
  if (confirm("Are you sure you want to delete this node?")) {
    remove(ref(db, "users/" + currentUserUid + "/rooms/" + roomKey + "/nodes/" + nodeKey));
  }
}
function duplicateNode(roomKey, nodeKey, nodeData) {
  // Duplicate node by pushing a new node with same data.
  push(ref(db, "users/" + currentUserUid + "/rooms/" + roomKey + "/nodes"), nodeData);
}
function pinNode(roomKey, nodeKey) {
  // For pinning, you might update a property on the node and then show it on the dashboard top.
  update(ref(db, "users/" + currentUserUid + "/rooms/" + roomKey + "/nodes/" + nodeKey), { pinned: true });
  alert("Node pinned (this will move it to the dashboard top in the future).");
}
