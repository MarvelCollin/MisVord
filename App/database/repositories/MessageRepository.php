<?php

require_once __DIR__ . '/Repository.php';
require_once __DIR__ . '/../models/Message.php';
require_once __DIR__ . '/../query.php';

class MessageRepository extends Repository {
    protected function getModelClass() {
        return Message::class;
    }
    
    public function create($data) {
        $message = new Message($data);
        if ($message->save()) {
            return $message;
        }
        return null;
    }
    
    public function createWithSentAt($data) {
        if (!isset($data['sent_at'])) {
            $data['sent_at'] = indonesiaTime();
        }
        return $this->create($data);
    }
    
    /**
     * Add an attachment to a message
     * @param int $messageId The message ID
     * @param string $attachmentUrl The attachment URL
     * @return bool Success or failure
     */
    public function addAttachment($messageId, $attachmentUrl) {
        error_log("MessageRepository: Adding attachment $attachmentUrl to message $messageId");
        
        try {
            $message = $this->find($messageId);
            if (!$message) {
                error_log("MessageRepository: Message $messageId not found when adding attachment");
                return false;
            }
            

            $attachments = [];
            if ($message->attachment_url) {
                $decoded = json_decode($message->attachment_url, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $attachments = $decoded;
                } else {

                    $attachments = [$message->attachment_url];
                }
            }
            

            $attachments[] = $attachmentUrl;
            

            return $this->update($messageId, [
                'attachment_url' => json_encode(array_values($attachments))
            ]);
        } catch (Exception $e) {
            error_log("MessageRepository: Error adding attachment: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Add a mention to a message
     * @param int $messageId The message ID
     * @param string $mentionType The mention type (e.g., 'user', 'channel')
     * @param int $mentionId The ID of the mentioned entity
     * @return bool Success or failure
     */
    public function addMention($messageId, $mentionType, $mentionId) {
        error_log("MessageRepository: Adding $mentionType mention $mentionId to message $messageId");
        
        try {


            return true;
        } catch (Exception $e) {
            error_log("MessageRepository: Error adding mention: " . $e->getMessage());
            return false;
        }
    }
    
    public function getRecentMessages($limit = 50) {
        $query = new Query();
        return $query->table('messages')
            ->orderBy('sent_at', 'DESC')
            ->limit($limit)
            ->get();
    }
    
    public function markAsEdited($messageId) {
        return $this->update($messageId, ['edited_at' => indonesiaTime()]);
    }    public function getReplies($messageId) {
        return $this->getAllBy('reply_message_id', $messageId);
    }
      public function searchInChannel($channelId, $searchQuery, $limit = 50) {
        $query = new Query();
        $results = $query->table('messages m')
            ->join('channel_messages cm', 'm.id', '=', 'cm.message_id')
            ->where('cm.channel_id', $channelId)
            ->where('m.content', 'LIKE', "%{$searchQuery}%")
            ->select('m.*')
            ->orderBy('m.created_at', 'DESC')
            ->limit($limit)
            ->get();
        
        $messages = [];
        foreach ($results as $result) {
            $messages[] = new Message($result);
        }
        
        return $messages;
    }
    
    public function searchInServer($serverId, $searchQuery, $limit = 50) {
        try {
            if (!$serverId || !is_numeric($serverId)) {
                return [];
            }

            if (empty($searchQuery) || strlen(trim($searchQuery)) < 1) {
                return [];
            }

            $searchQuery = trim($searchQuery);
            if (strlen($searchQuery) > 255) {
                $searchQuery = substr($searchQuery, 0, 255);
            }

            $query = new Query();
            $results = $query->table('messages m')
                ->join('channel_messages cm', 'm.id', '=', 'cm.message_id')
                ->join('channels c', 'cm.channel_id', '=', 'c.id')
                ->join('users u', 'm.user_id', '=', 'u.id')
                ->where('c.server_id', (int)$serverId)
                ->where('m.content', 'LIKE', "%{$searchQuery}%")
                ->select('m.id, m.content, m.user_id, m.sent_at, m.message_type, u.username, u.avatar_url, c.name as channel_name, c.id as channel_id')
                ->orderBy('m.sent_at', 'DESC')
                ->limit((int)$limit)
                ->get();
            
            return $results ?: [];
        } catch (Exception $e) {
            error_log("Error in MessageRepository::searchInServer: " . $e->getMessage());
            return [];
        }
    }
    
  
    public function countToday() {
        $query = new Query();
        $today = date('Y-m-d 00:00:00');
        
        $result = $query->table('messages')
            ->where('sent_at', '>=', $today)
            ->count();
            
        return $result;
    }
    
    public function getMessageStatsByDay($days = 7) {
        $stats = [];
        $query = new Query();
        
        
        for ($i = $days - 1; $i >= 0; $i--) {
            $date = date('Y-m-d', strtotime("-$i days"));
            $stats[$date] = 0;
        }
        
        
        $startDate = date('Y-m-d', strtotime("-" . ($days - 1) . " days"));
        $results = $query->query(
            "SELECT DATE(sent_at) as date, COUNT(*) as count 
             FROM messages 
             WHERE DATE(sent_at) >= ? 
             GROUP BY DATE(sent_at)
             ORDER BY date ASC",
            [$startDate]
        );
        
        
        foreach ($results as $row) {
            if (isset($stats[$row['date']])) {
                $stats[$row['date']] = (int)$row['count'];
            }
        }
        
        return $stats;
    }
    
            
    public function getMessageStatsByWeek($weeks = 4) {
        $stats = [];
        $query = new Query();
        
        
        for ($i = $weeks - 1; $i >= 0; $i--) {
            $weekStart = date('Y-m-d', strtotime("-$i weeks", strtotime('monday this week')));
            $weekEnd = date('Y-m-d', strtotime("+6 days", strtotime($weekStart)));
            $weekLabel = $weekStart . ' to ' . $weekEnd;
            $stats[$weekLabel] = 0;
        }
        
        
        $startDate = date('Y-m-d', strtotime("-" . ($weeks - 1) . " weeks", strtotime('monday this week')));
        $results = $query->query(
            "SELECT 
                CONCAT(
                    DATE(DATE_SUB(sent_at, INTERVAL WEEKDAY(sent_at) DAY)),
                    ' to ',
                    DATE(DATE_ADD(DATE_SUB(sent_at, INTERVAL WEEKDAY(sent_at) DAY), INTERVAL 6 DAY))
                ) as week_range,
                COUNT(*) as count 
             FROM messages 
             WHERE DATE(sent_at) >= ? 
             GROUP BY week_range
             ORDER BY MIN(sent_at) ASC",
            [$startDate]
        );
        
        
        foreach ($results as $row) {
            if (isset($stats[$row['week_range']])) {
                $stats[$row['week_range']] = (int)$row['count'];
            }
        }
        
        return $stats;
    }
    
    /**
     * Get messages for a chat room
     */
    public function getForChatRoom($roomId, $limit = 50, $offset = 0) {
        $query = new Query();
        $results = $query->table('messages m')
            ->join('chat_room_messages crm', 'm.id', '=', 'crm.message_id')
            ->join('users u', 'm.user_id', '=', 'u.id')
            ->where('crm.room_id', $roomId)
            ->select('m.*, u.username, u.avatar_url')
            ->orderBy('m.sent_at', 'DESC')
            ->limit($limit)
            ->offset($offset)
            ->get();
        
        return array_reverse($results);
    }
    
    /**
     * Get messages for a channel
     */
    public function getForChannel($channelId, $limit = 50, $offset = 0) {
        $query = new Query();
        $results = $query->table('messages m')
            ->join('channel_messages cm', 'm.id', '=', 'cm.message_id')
            ->join('users u', 'm.user_id', '=', 'u.id')
            ->where('cm.channel_id', $channelId)
            ->select('m.*, u.username, u.avatar_url')
            ->orderBy('m.sent_at', 'DESC')
            ->limit($limit)
            ->offset($offset)
            ->get();
        
        return array_reverse($results);
    }
}
