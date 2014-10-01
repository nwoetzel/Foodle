<?php
	$this->includeAtTemplateBase('includes/header.php');
    $user = $this->data['user'];
?>
<div class="container">
	<div class="row">
		<div class="col-lg-12 uninett-color-white uninett-padded">
		<h1 style="margin-bottom: 0px"><?php echo htmlspecialchars($user->username); ?></h1>
<?php

echo '<p style="color: #999; margin-top: 2px; margin-bottom: 35px"><tt>' . htmlspecialchars($user->userid) . '</tt></p>';

echo('<form method="post" action="/profile">');

echo '<dl>';

echo ' <dt>Organization</dt>';
echo ' <dd>' . htmlspecialchars($user->org) ;
if (!empty($user->orgunit)) {
	echo ' › ' . htmlspecialchars($user->orgunit);
}

echo ' </dd>';

echo ' <dt>Email</dt>';
echo ' <dd>' . htmlspecialchars($user->email) . '</dd>';

echo ' <dt>Location</dt>';
echo ' <dd>' . htmlspecialchars($user->location) . '</dd>';

echo ' <dt>Timezone</dt>';
echo ' <dd>' . htmlspecialchars($user->timezone) . '</dd>';
// $current = $this->data['timezone']->getTimeZone();
// echo( '<dd>' . $this->data['timezone']->getHTMLList($current) . '</dd>');

#	echo('<span>' . $this->t('selecttimezone') . ': ');

echo ' <dt>Preferred language</dt>';
echo ' <dd>' . htmlspecialchars($user->language) . '</dd>';

echo '</dl>';
/*

echo '<h2>' . $this->t('notifcations') . '</h2>';

function snot($id, $template,  $user, $default = FALSE) {
	$checked = $user->notification($id, $default);
	$checkedstr = ($checked ? ' checked="checked" ' : '');
	$tag = 'notify_' . $id;
	echo '<p><input type="checkbox" id="' . $tag . '" name="' . $tag . '" ' . $checkedstr . ' />';
	echo ' <label for="' . $tag . '">' . $template->t($tag) . '</label></p>';

}

snot('newresponse', $this, $user, FALSE);
snot('newfoodle', $this, $user, TRUE);
snot('otherstatus', $this, $user, TRUE);
snot('news', $this, $user, FALSE);


echo('<p><input type="submit" class="btn btn-primary" name="submit_profile" value="' . $this->t('profile_save') . '"></p></form>');
*/
?>

<?php
	if (!empty($user->photol)) {
		echo '<img style="max-width: 250px; border: 1px solid #888; margin: 2em 1em" src="' . htmlspecialchars($user->getPhotoURL('l')) . '" />';
	}
?>

			<h2><?php echo $this->t('bc_attribute_check'); ?></h2>
		<ul>
			<li><a href="/attributes"><?php echo $this->t('bc_attribute_check'); ?></a></li>
		</ul>
</div></div></div>

<?php $this->includeAtTemplateBase('includes/footer.php'); ?>