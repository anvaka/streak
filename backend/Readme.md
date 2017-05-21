# Backed design

Why do we need a backend?

I want to let people follow each other and motivate each other to keep building
habits. To the best of my knowledge, this cannot be done with using just Google
Drive or Google Sheets API.

Thus, I'm building a backend. This document describes what we store.

## Requirements

People should be able to publicly share their projects.

Sharing a project publicly is trivially achieved by using Google Drive API.

What is [not trivial](http://stackoverflow.com/questions/42983768/how-to-find-all-files-shared-by-a-given-google-drive-user)
is how to get a list of publicly shared documents from two unconnected users.

To enable such connection we would need to store identifiers of the publicly shared
streaks, and when someone opens a user profile - show the publicly shared documents.

As a backend I'm going to use a DynamoDB table. After gradual learning curve
its usability, scalability and ease of access are extremely compelling to me.

