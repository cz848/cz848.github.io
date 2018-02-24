<?php
header("Content-type:text/html;charset=utf-8");
error_reporting(0);

//Process a new form submission in HubSpot in order to create a new Contact.
$hubspotutk      = $_COOKIE['hubspotutk']; //grab the cookie from the visitors browser.
$ip_addr         = $_SERVER['REMOTE_ADDR']; //IP address too.

if($hubspotutk){
	$hs_context      = array(
	    'hutk' => $hubspotutk,
	    'ipAddress' => $ip_addr,
	    'pageUrl' => 'http://'.$_SERVER['HTTP_HOST'].'/get-in-touch.html',
	    'pageName' => 'steelcase'
	);
	$hs_context_json = json_encode($hs_context);

	// $firstname = 'test';
	// $jobtitle = 'jobtitle';
	// $email = 'test@test.com';
	// $company = 'company';
	// $phone = '13812345678';
	// $country_code = 'China (+86)';
	// $message = 'message';
	// 
	$firstname = $_POST['firstname'];
	$jobtitle = $_POST['jobtitle'];
	$email = $_POST['email'];
	$company = $_POST['company'];
	$phone = $_POST['phone'];
	$country_code = $_POST['country_code'];
	$message = $_POST['message'];


	//Need to populate these variable with values from the form.
	$str_post = "firstname=" . urlencode($firstname) 
	    . "&jobtitle=" . urlencode($jobtitle) 
	    . "&email=" . urlencode($email) 
	    . "&phone=" . urlencode($phonenumber) 
	    . "&company=" . urlencode($company) 
	    . "&country_code=" . urlencode($country_code) 
	    . "&message=" . urlencode($message) 
	    . "&hs_context=" . urlencode($hs_context_json); //Leave this one be

	//replace the values in this URL with your portal ID and your form GUID
	$endpoint = 'https://forms.hubspot.com/uploads/form/v2/1822507/02b027b2-4de5-4d52-8755-4ef334faeb9c';

	$ch = @curl_init();
	@curl_setopt($ch, CURLOPT_POST, true);
	@curl_setopt($ch, CURLOPT_POSTFIELDS, $str_post);
	@curl_setopt($ch, CURLOPT_URL, $endpoint);
	@curl_setopt($ch, CURLOPT_HTTPHEADER, array(
	    'Content-Type: application/x-www-form-urlencoded'
	));
	@curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	$response    = @curl_exec($ch); //Log the response from HubSpot as needed.
	$status_code = @curl_getinfo($ch, CURLINFO_HTTP_CODE); //Log the response status code
	@curl_close($ch);
	// echo $status_code . " " . $response;

	if( $status_code == 204 || $status_code == 302 ){
		echo 1;exit;
	}

	
}

echo 0;exit;