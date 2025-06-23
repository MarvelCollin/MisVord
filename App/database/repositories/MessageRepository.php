<?php

require_once __DIR__ . '/Repository.php';
require_once __DIR__ . '/../models/Message.php';
require_once __DIR__ . '/../query.php';

class MessageRepository extends Repository {
    protected function getModelClass() {
        return Message::class;
    }
    
    public function getForChannel($channelId, $limit = 50, $offset = 0) {
        return Message::getForChannel($channelId, $limit, $offset);
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
    
    /**
     * Get message statistics by day for the last n days
     *
     * @param int $days Number of days to look back
     * @return array Daily message stats
     */
    public function getMessageStatsByDay($days = 7) {
        $stats = [];
        $query = new Query();
        
        // Initialize the array with zeros for all days
        for ($i = $days - 1; $i >= 0; $i--) {
            $date = date('Y-m-d', strtotime("-$i days"));
            $stats[$date] = 0;
        }
        
        // Get the actual counts from the database
        $startDate = date('Y-m-d', strtotime("-" . ($days - 1) . " days"));
        $results = $query->query(
            "SELECT DATE(sent_at) as date, COUNT(*) as count 
             FROM messages 
             WHERE DATE(sent_at) >= ? 
             GROUP BY DATE(sent_at)
             ORDER BY date ASC",
            [$startDate]
        );
        
        // Fill in the actual counts
        foreach ($results as $row) {
            if (isset($stats[$row['date']])) {
                $stats[$row['date']] = (int)$row['count'];
            }
        }
        
        return $stats;
    }
    
    /**
     * Get message statistics by week for the last n weeks
     *
     * @param int $weeks Number of weeks to look back
     * @return array Weekly message stats
     */
    public function getMessageStatsByWeek($weeks = 4) {
        $stats = [];
        $query = new Query();
        
        // Initialize the array with zeros for all weeks
        for ($i = $weeks - 1; $i >= 0; $i--) {
            $weekStart = date('Y-m-d', strtotime("-$i weeks", strtotime('monday this week')));
            $weekEnd = date('Y-m-d', strtotime("+6 days", strtotime($weekStart)));
            $weekLabel = $weekStart . ' to ' . $weekEnd;
            $stats[$weekLabel] = 0;
        }
        
        // Get the actual counts from the database
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
        
        // Fill in the actual counts
        foreach ($results as $row) {
            if (isset($stats[$row['week_range']])) {
                $stats[$row['week_range']] = (int)$row['count'];
            }
        }
        
        return $stats;
    }
}
