
export type Keywords = {
    and:(string | Keywords)[];
} | {
    or: (string | Keywords)[];
}
