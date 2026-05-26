---
title: "SSH Essentials"
date: 2022-11-24T22:37:56+03:00
draft: false
categories: ["Linux", "SSH"]
tags: ["ssh"]
description: "This post discusses how to connect to a remote server using SSH."
---

## Connecting to a Remote Server through SSH
SSH (Secured Shell) is a program for accessing and managing remote machines. It is intended to provide secure encrypted communications between two untrusted hosts over an insecure network.

<br/>

In this article, we will refer to the machine initiating the SSH connection as the **local** or **client** system and the device on the receiving end as the **server** or **remote** machine. 

<br/>

Note that the installation commands may be different based on the system you are running. Nevertheless, it should be easy to tweak these commands on Linux and MacOS.

1. **Install an OpenSSH Client on the Local Machine**
- Check if the SSH client is installed by running `ssh` on the terminal.
- If the OpenSSH client is not installed, you can install it using the line
```bash
sudo apt install openssh-client
```
2. **Install an OpenSSH Server on the Remote System**
- Check if OpenSSH Server is installed by running `ssh localhost`.
- If the server is not installed, you will see something like this: 

	_ssh: connect to host localhost port 22: Connection refused_
- If the server is not installed on the remote, you can install it using the following line
```bash
sudo apt-get install openssh-server
```

**Note:** _If you intend to connect to and from the remote machine, you should install OpenSSH Client and OpenSSH Server on the local and remote machines._

3. **Verify that OpenSSH Server is running (by default, it should be running after installation)**
- Run `sudo service ssh status`
- If the server daemon is not running, you can restart it with,
```bash
sudo service ssh restart
```

4. Get the IP address of the remote machine using the `sudo ifconfig -a` command. (You may need to install net-tools if ifconfig is not found: `sudo apt install net-tools`)

![Getting Remote IP](/images/ifconfig_remote2.png#center)

5. **Connect via SSH**
- General syntax to connect: `ssh your_username@host_ip_address`

![Connecting to the Remote via SSH](/images/login_to_remote.png#center)

6. **Allow SSH to establish the connection via firewall using UFW.**
	- Install UFW: `sudo apt install ufw`,
	- Check if UFW is running: `sudo ufw status`,
	- Start UFW: `sudo ufw enable`,
	- When the VPS is set up for IPv6, make sure to confirm that UFW is set up to handle IPv6 as well: `sudo nano /etc/default/ufw`,
	- Allow SSH: `sudo ufw allow ssh` or `sudo ufw allow 22/tcp`,
	- The TCP protocol facilitates the communication on port 22 with this instruction. Allow TCP to connect using `sudo ufw allow 2222/tcp`
	- Revoke permission for SSH: `sudo ufw delete allow ssh`. The same can be done for TCP.

Every time you SSH to a remote server, you will be required to input the password for the remote machine as a form of authentication. Another way of authentication is to use SSH Keys.

## Generating SSH Keys

Generate SSH Keys of RSA type and 4096 bytes in size by running the command
```bash
ssh-keygen -t rsa -b 4096
```
You can accept the defaults and set the passphrase if you want (keep the passphrase safe).

At this point, you can then copy the contents of _id_rsa.pub_ and share them as needed for verification. You can do the copying manually or use the following commands.
```bash
ls ~/.ssh
ssh-add ~/.ssh/id_rsa
cat ~/.ssh/id_rsa.pub | xclip -sel  clip
```

## Using SSH Key-Based Authentication
This Section discusses how to use the SSH Keys you generated above for authentication instead of using a password every time we SSH to a server.

1. [On the local] After generating the SSH Keys in the previous Section, you will have a .ssh folder in the home directory with two files: 
	- `id_rsa` - This is a private key. DO NOT SHARE IT.
	- `id_rsa.pub` - The associated public key. This is the key you should be sharing for authentication.
2. [On the remote] Make a .ssh folder on the remotes's home directory (if it does not exist already). 
3. Copy the public key on the local machine into the .ssh folder in the remote. You can rename it in the process (recommended). 

```bash
scp ~/.ssh/id_rsa.pub  koech@192.168.100.55:/home/koech/.ssh/dell_id_rsa.pub
```
The command above copied id_rsa.pub as dell_id_rsa.pub to the remote machine with the user name koech and IP as 192.168.100.55.

To complete steps 4 and 5, you need to SSH into the remote machine (at this point, you have to use the password)  using the `ssh username@remove_ip` command, for example, `ssh koech@192.168.100.5`.

4. [On the remote] Copy the content of the file copied in (3) into another file named *authorized_keys* (don't name that file any other way) by running

```bash
cd ~/.ssh/
cat dell_id_rsa.pub >> authorized_keys
```
You can check that the keys were correctly copied by running:
```bash
cat authorized_keys
```

5. [On the remote] Run the following commands on the .ssh folder 

`chmod 700 path/to/ssh_folder`

`chmod 600 path/to/ssh_folder_contents`

that is,
```bash
chmod 700 .
chmod 600 *
```

At this point, you should be able to SSH into the remote machine without a password.
