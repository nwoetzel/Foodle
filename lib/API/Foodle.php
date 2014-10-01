<?php

class API_Foodle extends API_API {

	protected $contacts, $list;
	protected $parameters;
	protected $foodleid, $foodle, $responses;

	function __construct($config, $parameters) {
		parent::__construct($config, $parameters);


	}

	function prepare() {

		$parameters = null;
		$object = null;

		// All requests point at a specific Foodle
		if (self::route(false, '^/api/f/([^/]+)(/|$)', $parameters, $object)) {

			// print_r($parameters);

			Data_Foodle::requireValidIdentifier($parameters[1]);
			$this->foodleid = $parameters[1];
			$this->foodle = $this->fdb->readFoodle($this->foodleid);


			if (self::route('get', '^/api/f/([^/]+)$', $parameters, $object)) {

				return $this->foodle->getView();

			} else if (self::route('get', '^/api/f/([^/]+)/responders$', $parameters, $object)) {

				$this->responses = $this->fdb->readResponses($this->foodle, NULL, FALSE);

				$respobj = array();
				foreach($this->responses AS $key => $r) {
					$respobj[$key] = $r->getView();
				}

				return $respobj;


			} else if (self::route('get', '^/api/f/([^/]+)/discussion$', $parameters, $object)) {


				$discussion = $this->fdb->readDiscussion($this->foodle);
				return $discussion;
			}


		}

		throw new Exception('Invalid request parameters');
	}

}