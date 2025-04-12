-- USERS TABLE
CREATE TABLE Users (
    ID INT PRIMARY KEY,
    Username VARCHAR(255),
    Email VARCHAR(255),
    Password VARCHAR(255),
    GoogleID VARCHAR(255),
    AvatarURL VARCHAR(255),
    Status VARCHAR(255)
);

-- SERVER TABLE
CREATE TABLE Server (
    ID INT PRIMARY KEY,
    Name VARCHAR(MAX),
    ImageURL VARCHAR(MAX),
    Description VARCHAR(MAX),
    InviteLink VARCHAR(MAX)
);

-- SERVER INVITE
CREATE TABLE ServerInvite (
    ID INT PRIMARY KEY,
    ServerID INT,
    InviterUserID INT,
    TargetUserID INT,
    InviteLink VARCHAR(MAX),
    FOREIGN KEY (ServerID) REFERENCES Server(ID),
    FOREIGN KEY (InviterUserID) REFERENCES Users(ID),
    FOREIGN KEY (TargetUserID) REFERENCES Users(ID)
);

-- USER SERVER MEMBERSHIPS
CREATE TABLE UserServerMemberships (
    ID INT PRIMARY KEY,
    UserID INT,
    ServerID INT,
    Role VARCHAR(255),
    FOREIGN KEY (UserID) REFERENCES Users(ID),
    FOREIGN KEY (ServerID) REFERENCES Server(ID)
);

-- GROUP SERVER
CREATE TABLE GroupServer (
    ID INT PRIMARY KEY,
    ServerID INT,
    GroupName VARCHAR(255),
    FOREIGN KEY (ServerID) REFERENCES Server(ID)
);

-- ROLE TABLE
CREATE TABLE Role (
    ID INT PRIMARY KEY,
    ServerID INT,
    RoleName VARCHAR(255),
    RoleColor VARCHAR(MAX),
    FOREIGN KEY (ServerID) REFERENCES Server(ID)
);

-- USER ROLES
CREATE TABLE UserRoles (
    ID INT PRIMARY KEY,
    UserID INT,
    RoleID INT,
    FOREIGN KEY (UserID) REFERENCES Users(ID),
    FOREIGN KEY (RoleID) REFERENCES Role(ID)
);

-- ROLE PERMISSIONS
CREATE TABLE RolePermission (
    ID INT PRIMARY KEY,
    RoleID INT,
    ChannelID INT,
    CanDelete BOOLEAN,
    CanManage BOOLEAN,
    CanWrite BOOLEAN,
    CanRead BOOLEAN,
    FOREIGN KEY (RoleID) REFERENCES Role(ID),
    FOREIGN KEY (ChannelID) REFERENCES Channel(ID)
);

-- CHANNEL
CREATE TABLE Channel (
    ID INT PRIMARY KEY,
    ServerID INT,
    Name VARCHAR(MAX),
    IsPrivate BOOLEAN,
    Type VARCHAR(MAX),
    FOREIGN KEY (ServerID) REFERENCES Server(ID)
);

-- CHANNEL MESSAGE (MANY-TO-MANY)
CREATE TABLE ChannelMessage (
    ID INT PRIMARY KEY,
    ChannelID INT,
    MessageID INT,
    FOREIGN KEY (ChannelID) REFERENCES Channel(ID),
    FOREIGN KEY (MessageID) REFERENCES Message(ID)
);

-- MESSAGE
CREATE TABLE Message (
    ID INT PRIMARY KEY,
    UserID INT,
    ReplyMessageID INT,
    Content VARCHAR(MAX),
    SentAt DATE,
    EditedAt DATE,
    MessageType VARCHAR(MAX),
    AttachmentURL VARCHAR(MAX),
    FOREIGN KEY (UserID) REFERENCES Users(ID),
    FOREIGN KEY (ReplyMessageID) REFERENCES Message(ID)
);

-- PINNED MESSAGE
CREATE TABLE PinnedMessage (
    ID INT PRIMARY KEY,
    MessageID INT,
    PinnedByUserID INT,
    PinnedAt DATE,
    FOREIGN KEY (MessageID) REFERENCES Message(ID),
    FOREIGN KEY (PinnedByUserID) REFERENCES Users(ID)
);

-- MESSAGE REACTIONS
CREATE TABLE MessageReaction (
    ID INT PRIMARY KEY,
    MessageID INT,
    UserID INT,
    Emoji VARCHAR(MAX),
    FOREIGN KEY (MessageID) REFERENCES Message(ID),
    FOREIGN KEY (UserID) REFERENCES Users(ID)
);

-- FRIEND LIST
CREATE TABLE FriendList (
    ID INT PRIMARY KEY,
    UserID INT,
    UserID2 INT,
    Status VARCHAR(255),
    FOREIGN KEY (UserID) REFERENCES Users(ID),
    FOREIGN KEY (UserID2) REFERENCES Users(ID)
);

-- USER PRESENCE
CREATE TABLE UserPresence (
    ID INT PRIMARY KEY,
    UserID INT,
    Status VARCHAR(MAX),
    ActivityType VARCHAR(MAX),
    ActivityDetails VARCHAR(MAX),
    LastSeen DATE,
    FOREIGN KEY (UserID) REFERENCES Users(ID)
);

-- CHAT ROOM
CREATE TABLE ChatRoom (
    ID INT PRIMARY KEY,
    Type VARCHAR(MAX),
    Name VARCHAR(MAX)
);

-- CHAT PARTICIPANTS
CREATE TABLE ChatParticipants (
    ID INT PRIMARY KEY,
    ChatRoomID INT,
    UserID INT,
    FOREIGN KEY (ChatRoomID) REFERENCES ChatRoom(ID),
    FOREIGN KEY (UserID) REFERENCES Users(ID)
);

-- CHAT ROOM MESSAGE
CREATE TABLE ChatRoomMessage (
    ID INT PRIMARY KEY,
    RoomID INT,
    MessageID INT,
    FOREIGN KEY (RoomID) REFERENCES ChatRoom(ID),
    FOREIGN KEY (MessageID) REFERENCES Message(ID)
);
