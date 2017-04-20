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

### Graph storage

I envision a simple schema, which would allow us to store such connections, and
extend it to future cases (e.g. to allow people follow each other). At the core
I put an assumption, that we need to store a social graph.

There will be two tables `Nodes` and `Edges`.

#### Nodes

Each node is identified by a unique hash key, which is `entity_type.entity_id`.

For example, my user will be given a key `user.anvaka` in then nodes table. While
my public projects will be `project.012356`.

Each node will have a set of attributes, but in general, they should not be larger
than 1Kb. I think the attributes will mostly be used to "cache" and aggregate
statistics about edges.

For example, a `user` node could have:

* a numeric attribute which represents total number of projects;
* a collection with top 10 last touched public projects;

This way we are optimizing for a case of exploring what's new with a user, and
provide some statistics on their profile.

#### Edges

Edges are identified by `source`, `target`, and `connection type`. We want to
optimize the following access pattern:

1. For a given user, give a list of their followers;
2. For a given follower, find whom they follow;

This can be achieved (in theory) by making a composite key in the edges table.
The hash part of the key represents a node id (see description in the `Nodes`
section), the sort key has a form of `edge_type.time_stamp`.

This structure alone, would let us quickly find our followers (using `begins_with`
condition on the sort key).

How do we find who our followers follow? - Make a global secondary index (GSI) on the
other side of the edge, and use the same sort index:

FromId (hash key) | edgeType.timestamp (sortKey) | ToId (GSI)
