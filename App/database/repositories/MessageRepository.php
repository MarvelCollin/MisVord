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
            $data['sent_at'] = date('Y-m-d H:i:s');
        }
        return $this->create($data);
    }
    
    public function getRecentMessages($limit = 50) {
        $query = new Query();
        return $query->table('messages')
            ->orderBy('sent_at', 'DESC')
            ->limit($limit)
            ->get();
    }
    
    public function markAsEdited($messageId) {
        return $this->update($messageId, ['edited_at' => date('Y-m-d H:i:s')]);
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
     * Get messages for a chat room (DM)
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
