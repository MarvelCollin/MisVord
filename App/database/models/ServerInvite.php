<?php

require_once __DIR__ . '/../query.php';

class ServerInvite {
    public $id;
    public $server_id;
    public $inviter_user_id;
    public $target_user_id;
    public $invite_link;
    public $created_at;
    public $updated_at;

    public static function create($data) {
        $query = new Query();

        $insertData = [
            'server_id' => $data['server_id'],
            'inviter_user_id' => $data['inviter_user_id'],
            'target_user_id' => $data['target_user_id'] ?? null,
            'invite_link' => $data['invite_link']
        ];

        $insertId = $query->table('server_invites')->insert($insertData);

        if ($insertId) {
            return self::find($insertId);
        }

        return false;
    }

    public static function find($id) {
        $query = new Query();
        $result = $query->table('server_invites')
                       ->where('id', $id)
                       ->first();

        if ($result) {
            $invite = new self();
            foreach ($result as $key => $value) {
                $invite->$key = $value;
            }
            return $invite;
        }

        return null;
    }

    public static function findByInviteCode($inviteCode) {
        $query = new Query();
        $result = $query->table('server_invites')
                       ->where('invite_link', $inviteCode)
                       ->first();

        if ($result) {
            $invite = new self();
            foreach ($result as $key => $value) {
                $invite->$key = $value;
            }
            return $invite;
        }

        return null;
    }

    public static function findActiveByServer($serverId) {
        $query = new Query();
        $result = $query->table('server_invites')
                       ->where('server_id', $serverId)
                       ->orderBy('created_at', 'DESC')
                       ->first();

        if ($result) {
            $invite = new self();
            foreach ($result as $key => $value) {
                $invite->$key = $value;
            }
            return $invite;
        }

        return null;
    }

    public static function deleteOldInvites($serverId) {
        $query = new Query();
        return $query->table('server_invites')
                    ->where('server_id', $serverId)
                    ->delete();
    }
}