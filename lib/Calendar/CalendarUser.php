<?php

class Calendar_CalendarUser {

	protected $config, $user;
	protected $fdb;

	function __construct($config, $userid, $token) {
		$this->config = $config;
		$this->fdb = new FoodleDBConnector($this->config);

		$this->verifyToken($userid, $token);


	}

	protected function verifyToken($userid, $token) {
		if (!($this->fdb->userExists($userid))) throw new Exception('User does not exist');
		$this->user = $this->fdb->readUser($userid);
		$this->user->anonymous = false;
		if(!$this->user->validateToken($token, 'calendar')) {
			throw new Exception('Invalid user token. Access denied.');
		}
	}

	function show() {

		$as = new Data_EventStream($this->fdb, $this->user, false);
		$as->prepareUser();
		$stream = $as->getData();

		$feed = '';

		foreach($stream AS $e) {
			$feed .= $this->createVEvent($e);
		}

		// echo '<pre>'; print_r($stream); exit;

		//set correct content-type-header
		header('Content-type: text/calendar; charset=utf-8');
		header('Content-Disposition: inline; filename=calendar.ics');

		echo $this->createVCalendar($feed);
	}

	function dtstamp() {
		return gmdate('Ymd\THis\Z');
	}

	function createVEvent($data) {
		$url = FoodleUtils::getUrl() . 'foodle/' . $data['foodle']['id'];

		$identifier = $data['foodle']['id'];
		if (!empty($data['subid'])) {
			$identifier .= '#' . $data['subid'];
		}

		$title = $data['foodle']['name'];
		$status = 'CONFIRMED';
		$transp = 'OPAQUE';
		if ($data['type'] === 'tentative') {
			$status = 'TENTATIVE';
			$transp = 'TRANSPARENT';
			$title .= ' (tentative)';
		}


		return 'BEGIN:VEVENT
CREATED:' . $data['dtend'] . '
UID:' . strtoupper(sha1($identifier)) . '@foodl.org
' . $data['dtstart'] . '
' . $data['dtend'] . '
STATUS: ' . $status . '
TRANSP: '  . $transp. '
SUMMARY:' . $title . '
DTSTAMP:' . $this->dtstamp() . '
DESCRIPTION:' . trim(chunk_split(preg_replace('/[\n\r]+/', '\n\n', strip_tags($data['foodle']['descr'])), 76, "\n ")) . '
URL;VALUE=URI:' . $url . '
SEQUENCE:' . $data['created'] . '
END:VEVENT
';
	}

	function createVCalendar($content) {
		return 'BEGIN:VCALENDAR
CALSCALE:GREGORIAN
VERSION:2.0
METHOD:PUBLISH
PRODID:-//UNINETT//Foodle//EN
' . $content . '
END:VCALENDAR';
	}

}